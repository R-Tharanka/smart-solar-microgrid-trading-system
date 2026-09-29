// -----------------------------------------------------------------------------
// File: IdentityService.cs
// Member 1: Identity, Authentication, Authorization and Account Management
// Purpose: Enforces identity validation, authentication, profile, and account rules.
// -----------------------------------------------------------------------------
using MongoDB.Driver;
using System.Text.RegularExpressions;
using SmartSolarMicrogrid.Api.Contracts.Identity;
using SmartSolarMicrogrid.Api.Infrastructure;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Persistence.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class IdentityService(
    IUserRepository userRepository,
    IJwtTokenGenerator jwtTokenGenerator,
    IAccountDeactivationGuard accountDeactivationGuard,
    ILogger<IdentityService> logger) : IIdentityService
{
    public async Task<LoginResponse> AuthenticateAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        // Normalize the login identifier, verify credentials, and enforce active status.
        var identifier = NormalizeIdentifier(request.Identifier);
        var user = await userRepository.FindByIdentifierAsync(identifier, cancellationToken);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            logger.LogWarning("Authentication failed for an unknown user or invalid password");
            throw IdentityException.Unauthorized();
        }

        if (user.Status != UserStatus.Active)
        {
            logger.LogWarning("Authentication denied for inactive {Role} account", user.Role);
            throw IdentityException.Forbidden("AUTH_ACCOUNT_INACTIVE", "Account is not active.");
        }

        var token = jwtTokenGenerator.GenerateToken(user);
        await userRepository.RecordSuccessfulLoginAsync(identifier, DateTime.UtcNow, cancellationToken);
        logger.LogInformation("Authentication succeeded for {Role} account", user.Role);

        return new LoginResponse(token.Token, token.ExpiresAtUtc, MapToResponse(user));
    }

    public async Task<UserResponse> RegisterProsumerAsync(
        RegisterProsumerRequest request,
        CancellationToken cancellationToken = default)
    {
        // Normalize registration data and reject duplicate business identifiers.
        var nic = NormalizeNic(request.Nic);
        var email = NormalizeEmail(request.Email);
        var firstName = RequiredText(request.FirstName, "First name");
        var lastName = RequiredText(request.LastName, "Last name");
        var phoneNumber = RequiredPhone(request.PhoneNumber);
        var address = RequiredText(request.Address, "Address");

        if (await userRepository.FindByNicAsync(nic, cancellationToken) is not null)
        {
            throw IdentityException.Conflict("USER_NIC_EXISTS", "NIC is already registered.");
        }

        if (await userRepository.FindByEmailAsync(email, cancellationToken) is not null)
        {
            throw IdentityException.Conflict("USER_EMAIL_EXISTS", "Email is already registered.");
        }

        var user = new User
        {
            Nic = nic,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = firstName,
            LastName = lastName,
            PhoneNumber = phoneNumber,
            Address = address,
            Role = UserRole.Prosumer,
            Status = UserStatus.Active
        };

        await CreateUserAsync(user, cancellationToken);
        logger.LogInformation("Prosumer account registered");
        return MapToResponse(user);
    }

    public async Task<UserResponse> CreateStaffAsync(
        string actorIdentifier,
        CreateStaffRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate the requested staff role and preserve the creating administrator audit value.
        var email = NormalizeEmail(request.Email);
        if (await userRepository.FindByEmailAsync(email, cancellationToken) is not null)
        {
            throw IdentityException.Conflict("USER_EMAIL_EXISTS", "Email is already registered.");
        }

        if (!Enum.TryParse<UserRole>(request.Role, true, out var role) || role == UserRole.Prosumer)
        {
            throw IdentityException.Validation("Role must be Backoffice or GridOperator.");
        }

        var user = new User
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = RequiredText(request.FirstName, "First name"),
            LastName = RequiredText(request.LastName, "Last name"),
            Role = role,
            Status = UserStatus.Active,
            CreatedByIdentifier = NormalizeIdentifier(actorIdentifier)
        };

        await CreateUserAsync(user, cancellationToken);
        logger.LogInformation("{Role} staff account created by a Backoffice user", role);
        return MapToResponse(user);
    }

    public async Task<UserResponse> GetCurrentUserAsync(
        string identifier,
        CancellationToken cancellationToken = default)
    {
        // Resolve the current account and map only public profile fields.
        var user = await FindRequiredUserAsync(identifier, cancellationToken);
        return MapToResponse(user);
    }

    public async Task<UserResponse> GetActiveProsumerAsync(
        string nic,
        CancellationToken cancellationToken = default)
    {
        // Resolve the Prosumer by NIC and require an active account for dependent modules.
        var user = await userRepository.FindByNicAsync(NormalizeNic(nic), cancellationToken);
        if (user is null || user.Role != UserRole.Prosumer)
        {
            throw IdentityException.NotFound();
        }

        EnsureActive(user);
        return MapToResponse(user);
    }

    public async Task<UserResponse> UpdateProfileAsync(
        string identifier,
        UpdateProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        // Update common name fields and Prosumer-specific contact fields only.
        var user = await FindRequiredUserAsync(identifier, cancellationToken);
        EnsureActive(user);

        user.FirstName = RequiredText(request.FirstName, "First name");
        user.LastName = RequiredText(request.LastName, "Last name");
        if (user.Role == UserRole.Prosumer)
        {
            user.PhoneNumber = RequiredPhone(request.PhoneNumber ?? string.Empty);
            user.Address = RequiredText(request.Address ?? string.Empty, "Address");
        }

        await userRepository.UpdateAsync(user, cancellationToken);

        logger.LogInformation("Profile updated for {Role} account", user.Role);
        return MapToResponse(user);
    }

    public async Task ChangePasswordAsync(
        string identifier,
        ChangePasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        // Verify the old secret and prevent reusing the existing password.
        var user = await FindRequiredUserAsync(identifier, cancellationToken);
        EnsureActive(user);

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
        {
            throw IdentityException.BadRequest(
                "AUTH_CURRENT_PASSWORD_INVALID",
                "Current password is incorrect.");
        }

        if (BCrypt.Net.BCrypt.Verify(request.NewPassword, user.PasswordHash))
        {
            throw IdentityException.BadRequest(
                "AUTH_PASSWORD_UNCHANGED",
                "New password must be different from the current password.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await userRepository.UpdateAsync(user, cancellationToken);
        logger.LogInformation("Password changed for {Role} account", user.Role);
    }

    public async Task DeactivateOwnAccountAsync(
        string identifier,
        CancellationToken cancellationToken = default)
    {
        // Permit self-deactivation only for active Prosumers without blocking reservations.
        var user = await FindRequiredUserAsync(identifier, cancellationToken);
        if (user.Role != UserRole.Prosumer)
        {
            throw IdentityException.Forbidden(
                "USER_SELF_DEACTIVATION_FORBIDDEN",
                "Only Prosumers can deactivate their own account.");
        }

        if (user.Status != UserStatus.Active)
        {
            throw IdentityException.Conflict("USER_INVALID_STATUS", "Only an active account can be deactivated.");
        }

        await accountDeactivationGuard.EnsureCanDeactivateAsync(user.Nic!, cancellationToken);
        await SetStatusAsync(user, UserStatus.Deactivated, user.Nic!, cancellationToken);
    }

    public async Task ReactivateUserAsync(
        string actorIdentifier,
        string identifier,
        CancellationToken cancellationToken = default)
    {
        // Transition only a currently deactivated account back to active status.
        var user = await FindRequiredUserAsync(identifier, cancellationToken);
        if (user.Status != UserStatus.Deactivated)
        {
            throw IdentityException.Conflict("USER_INVALID_STATUS", "Only a deactivated account can be reactivated.");
        }

        await SetStatusAsync(user, UserStatus.Active, actorIdentifier, cancellationToken);
    }

    public async Task DeactivateUserAsync(
        string actorIdentifier,
        string identifier,
        CancellationToken cancellationToken = default)
    {
        // Enforce self-deactivation, final-admin, and reservation safeguards.
        var actor = NormalizeIdentifier(actorIdentifier);
        var target = await FindRequiredUserAsync(identifier, cancellationToken);

        if (NormalizeIdentifier(target.Nic ?? target.Email) == actor)
        {
            throw IdentityException.Conflict("USER_SELF_ADMIN_DEACTIVATION", "Backoffice users cannot deactivate their own account.");
        }

        if (target.Status != UserStatus.Active)
        {
            throw IdentityException.Conflict("USER_INVALID_STATUS", "Only an active account can be deactivated.");
        }

        if (target.Role == UserRole.Backoffice &&
            await userRepository.CountActiveBackofficeAsync(cancellationToken) <= 1)
        {
            throw IdentityException.Conflict("USER_LAST_ADMIN", "The final active Backoffice account cannot be deactivated.");
        }

        if (target.Role == UserRole.Prosumer)
        {
            await accountDeactivationGuard.EnsureCanDeactivateAsync(target.Nic!, cancellationToken);
        }

        await SetStatusAsync(target, UserStatus.Deactivated, actor, cancellationToken);
    }

    public async Task<List<UserResponse>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        // Map persisted accounts to responses that omit password hashes and MongoDB identifiers.
        var users = await userRepository.GetAllAsync(cancellationToken);
        return users.Select(MapToResponse).ToList();
    }

    private async Task<User> FindRequiredUserAsync(string identifier, CancellationToken cancellationToken)
    {
        // Resolve a normalized business identifier or raise the stable not-found error.
        return await userRepository.FindByIdentifierAsync(NormalizeIdentifier(identifier), cancellationToken)
            ?? throw IdentityException.NotFound();
    }

    private async Task CreateUserAsync(User user, CancellationToken cancellationToken)
    {
        // Translate a database unique-index race into the public identity conflict contract.
        try
        {
            await userRepository.CreateAsync(user, cancellationToken);
        }
        catch (MongoWriteException exception) when (exception.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            throw IdentityException.Conflict(
                "USER_IDENTIFIER_EXISTS",
                "The email or NIC is already registered.");
        }
    }

    private async Task SetStatusAsync(
        User user,
        UserStatus status,
        string changedByIdentifier,
        CancellationToken cancellationToken)
    {
        // Perform an expected-state transition and retain the normalized actor for auditing.
        var normalizedActor = NormalizeIdentifier(changedByIdentifier);
        if (!await userRepository.UpdateStatusAsync(
                user.Nic ?? user.Email,
                user.Status,
                status,
                normalizedActor,
                DateTime.UtcNow,
                cancellationToken))
        {
            throw IdentityException.NotFound();
        }

        logger.LogInformation("{Role} account status changed from {OldStatus} to {NewStatus}", user.Role, user.Status, status);
    }

    private static void EnsureActive(User user)
    {
        // Reject protected identity operations for pending or deactivated accounts.
        if (user.Status != UserStatus.Active)
        {
            throw IdentityException.Forbidden("AUTH_ACCOUNT_INACTIVE", "Account is not active.");
        }
    }

    private static string NormalizeIdentifier(string identifier)
    {
        // Select normalization rules according to the email-or-NIC identifier shape.
        return identifier.Contains('@', StringComparison.Ordinal)
            ? NormalizeEmail(identifier)
            : NormalizeNic(identifier);
    }

    private static string NormalizeEmail(string email)
    {
        // Store and compare email identifiers using a stable lowercase form.
        return email.Trim().ToLowerInvariant();
    }

    private static string NormalizeNic(string nic)
    {
        // Store and compare legacy NIC suffixes using a stable uppercase form.
        return nic.Trim().ToUpperInvariant();
    }

    private static string RequiredText(string value, string fieldName)
    {
        // Trim required text and reject values made only of whitespace.
        var normalized = value.Trim();
        return normalized.Length == 0
            ? throw IdentityException.Validation($"{fieldName} cannot contain only whitespace.")
            : normalized;
    }

    private static string RequiredPhone(string value)
    {
        // Normalize and validate the phone number against the shared request rule.
        var normalized = value.Trim();
        if (!Regex.IsMatch(normalized, IdentityValidationRules.PhonePattern))
        {
            throw IdentityException.Validation(IdentityValidationRules.PhoneError);
        }

        return normalized;
    }

    private static UserResponse MapToResponse(User user)
    {
        // Expose account data required by clients while omitting persistence and secret fields.
        return new(
            user.Nic,
            user.Email,
            user.FirstName,
            user.LastName,
            user.PhoneNumber,
            user.Address,
            user.Role.ToString(),
            user.Status.ToString());
    }
}
