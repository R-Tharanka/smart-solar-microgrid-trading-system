// -----------------------------------------------------------------------------
// File: IdentityServiceTests.cs
// Member 1: Identity, Authentication, Authorization and Account Management
// Purpose: Verifies identity business rules, account lifecycle, and security behavior.
// -----------------------------------------------------------------------------
using Microsoft.Extensions.Logging.Abstractions;
using SmartSolarMicrogrid.Api.Contracts.Identity;
using SmartSolarMicrogrid.Api.Infrastructure;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Persistence.Repositories;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Tests;

public sealed class IdentityServiceTests
{
    [Fact]
    public async Task RegisterProsumer_NormalizesAndHashesAccountData()
    {
        // Verify normalized profile data and one-way password hashing at registration.
        var repository = new FakeUserRepository();
        var service = CreateService(repository);

        var response = await service.RegisterProsumerAsync(
            new RegisterProsumerRequest(
                " 200012345678 ",
                " PERSON@Example.COM ",
                "Strong@123",
                " Ada ",
                " Lovelace ",
                " 0771234567 ",
                " Colombo 07 "), TestCancellation);

        var saved = Assert.Single(repository.Users);
        Assert.Equal("200012345678", saved.Nic);
        Assert.Equal("person@example.com", saved.Email);
        Assert.Equal("Ada", saved.FirstName);
        Assert.Equal("0771234567", saved.PhoneNumber);
        Assert.Equal("Colombo 07", saved.Address);
        Assert.Equal(UserRole.Prosumer, saved.Role);
        Assert.Equal(UserStatus.Pending, saved.Status);
        Assert.True(BCrypt.Net.BCrypt.Verify("Strong@123", saved.PasswordHash));
        Assert.NotEqual("Strong@123", saved.PasswordHash);
        Assert.Equal("person@example.com", response.Email);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task RegisterProsumer_RejectsDuplicateIdentifiers(bool duplicateNic)
    {
        // Verify that an existing NIC or email produces the matching conflict code.
        var repository = new FakeUserRepository();
        repository.Users.Add(Prosumer());
        var service = CreateService(repository);
        var request = duplicateNic
            ? new RegisterProsumerRequest("200012345678", "other@example.com", "Strong@123", "Test", "User", "0771234567", "Colombo")
            : new RegisterProsumerRequest("199912345678", "prosumer@example.com", "Strong@123", "Test", "User", "0771234567", "Colombo");

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            service.RegisterProsumerAsync(request, TestCancellation));

        Assert.Equal(StatusCodes.Status409Conflict, exception.StatusCode);
        Assert.Equal(duplicateNic ? "USER_NIC_EXISTS" : "USER_EMAIL_EXISTS", exception.ErrorCode);
    }

    [Fact]
    public async Task CreateProsumer_RecordsBackofficeCreator()
    {
        // Verify administrative creation produces an active Prosumer and records the Backoffice actor.
        var repository = new FakeUserRepository();
        var service = CreateService(repository);

        var response = await service.CreateProsumerAsync(
            "ADMIN@EXAMPLE.COM",
            new RegisterProsumerRequest(
                "199912345678",
                "NEW.PROSUMER@example.com",
                "Strong@123",
                "New",
                "Prosumer",
                "0777654321",
                "Kandy"),
            TestCancellation);

        var saved = Assert.Single(repository.Users);
        Assert.Equal(UserRole.Prosumer, saved.Role);
        Assert.Equal(UserStatus.Active, saved.Status);
        Assert.Equal("admin@example.com", saved.CreatedByIdentifier);
        Assert.Equal("new.prosumer@example.com", response.Email);
    }

    [Fact]
    public async Task PendingProsumer_CanBeActivatedOrRejectedOnlyByExpectedTransition()
    {
        // Verify Backoffice review applies only the required pending-state outcomes.
        var repository = new FakeUserRepository();
        var activated = Prosumer();
        activated.Status = UserStatus.Pending;
        var rejected = Prosumer();
        rejected.Nic = "199912345678";
        rejected.Email = "rejected@example.com";
        rejected.Status = UserStatus.Pending;
        repository.Users.AddRange([activated, rejected]);
        var service = CreateService(repository);

        await service.ActivateProsumerAsync("admin@example.com", activated.Nic!, TestCancellation);
        await service.RejectProsumerAsync(
            "admin@example.com",
            rejected.Nic!,
            new RejectProsumerRequest("Identity details could not be verified."),
            TestCancellation);

        Assert.Equal(UserStatus.Active, activated.Status);
        Assert.Equal(UserStatus.Rejected, rejected.Status);
        Assert.Equal("Identity details could not be verified.", rejected.RejectionReason);
        Assert.Equal("admin@example.com", rejected.StatusChangedByIdentifier);
    }

    [Fact]
    public async Task RegisterProsumer_ReusesRejectedNicRecordAsPending()
    {
        // Verify resubmission updates the rejected NIC document instead of inserting a duplicate.
        var repository = new FakeUserRepository();
        var rejected = Prosumer();
        rejected.Status = UserStatus.Rejected;
        rejected.RejectionReason = "Old reason";
        repository.Users.Add(rejected);
        var service = CreateService(repository);

        var response = await service.RegisterProsumerAsync(
            new RegisterProsumerRequest(
                rejected.Nic!,
                "resubmitted@example.com",
                "NewStrong@456",
                "Updated",
                "Prosumer",
                "0777654321",
                "Kandy"),
            TestCancellation);

        Assert.Single(repository.Users);
        Assert.Equal(UserStatus.Pending, rejected.Status);
        Assert.Null(rejected.RejectionReason);
        Assert.Equal("resubmitted@example.com", response.Email);
        Assert.True(BCrypt.Net.BCrypt.Verify("NewStrong@456", rejected.PasswordHash));
    }

    [Fact]
    public async Task Authenticate_WithActiveAccount_ReturnsTokenAndRecordsLogin()
    {
        // Verify successful login issues a token and records login audit metadata.
        var repository = new FakeUserRepository();
        repository.Users.Add(Prosumer());
        var service = CreateService(repository);

        var response = await service.AuthenticateAsync(
            new LoginRequest(" PROSUMER@EXAMPLE.COM ", "Strong@123", "Android"),
            TestCancellation);

        Assert.Equal("test-token", response.AccessToken);
        Assert.NotNull(repository.Users[0].LastLoginAtUtc);
    }

    [Fact]
    public async Task Authenticate_WithWrongPassword_ReturnsGenericUnauthorizedError()
    {
        // Verify an incorrect password does not reveal account-specific information.
        var repository = new FakeUserRepository();
        repository.Users.Add(Prosumer());
        var service = CreateService(repository);

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            service.AuthenticateAsync(new LoginRequest("prosumer@example.com", "Wrong@123", "Android"), TestCancellation));

        Assert.Equal(StatusCodes.Status401Unauthorized, exception.StatusCode);
        Assert.Equal("AUTH_INVALID_CREDENTIALS", exception.ErrorCode);
    }

    [Fact]
    public async Task Authenticate_WithUnknownAccount_ReturnsGenericUnauthorizedError()
    {
        // Verify an unknown account uses the same generic authentication response.
        var service = CreateService(new FakeUserRepository());

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            service.AuthenticateAsync(
                new LoginRequest("unknown@example.com", "Strong@123", "Android"),
                TestCancellation));

        Assert.Equal(StatusCodes.Status401Unauthorized, exception.StatusCode);
        Assert.Equal("AUTH_INVALID_CREDENTIALS", exception.ErrorCode);
    }

    [Theory]
    [InlineData(UserStatus.Pending)]
    [InlineData(UserStatus.Deactivated)]
    [InlineData(UserStatus.Rejected)]
    public async Task Authenticate_WithInactiveAccount_IsForbidden(UserStatus status)
    {
        // Verify pending and deactivated accounts cannot obtain access tokens.
        var repository = new FakeUserRepository();
        var user = Prosumer();
        user.Status = status;
        repository.Users.Add(user);
        var service = CreateService(repository);

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            service.AuthenticateAsync(new LoginRequest(user.Nic!, "Strong@123", "Android"), TestCancellation));

        Assert.Equal(StatusCodes.Status403Forbidden, exception.StatusCode);
        Assert.StartsWith("AUTH_", exception.ErrorCode);
    }

    [Theory]
    [InlineData(UserRole.Backoffice, "Web", true)]
    [InlineData(UserRole.Backoffice, "Android", false)]
    [InlineData(UserRole.GridOperator, "Web", true)]
    [InlineData(UserRole.GridOperator, "Android", true)]
    [InlineData(UserRole.Prosumer, "Web", false)]
    [InlineData(UserRole.Prosumer, "Android", true)]
    public async Task Authenticate_EnforcesClientRoleMatrix(
        UserRole role,
        string clientType,
        bool allowed)
    {
        // Verify every allowed and forbidden Web/Android role combination.
        var repository = new FakeUserRepository();
        var user = role == UserRole.Prosumer
            ? Prosumer()
            : Staff($"{role.ToString().ToLowerInvariant()}@example.com", role);
        repository.Users.Add(user);
        var service = CreateService(repository);

        var operation = () => service.AuthenticateAsync(
            new LoginRequest(user.Nic ?? user.Email, "Strong@123", clientType),
            TestCancellation);

        if (allowed)
        {
            Assert.Equal("test-token", (await operation()).AccessToken);
        }
        else
        {
            var exception = await Assert.ThrowsAsync<IdentityException>(operation);
            Assert.Equal("AUTH_CLIENT_ROLE_FORBIDDEN", exception.ErrorCode);
        }
    }

    [Fact]
    public async Task CreateStaff_RejectsProsumerRole()
    {
        // Verify the staff workflow cannot be used to create a Prosumer account.
        var service = CreateService(new FakeUserRepository());

        var exception = await Assert.ThrowsAsync<IdentityException>(() => service.CreateStaffAsync(
            "admin@example.com",
            new CreateStaffRequest("staff@example.com", "Strong@123", "Staff", "User", "Prosumer"),
            TestCancellation));

        Assert.Equal(StatusCodes.Status422UnprocessableEntity, exception.StatusCode);
    }

    [Theory]
    [InlineData("Backoffice", UserRole.Backoffice)]
    [InlineData("GridOperator", UserRole.GridOperator)]
    public async Task CreateStaff_CreatesPermittedActiveRole(string requestedRole, UserRole expectedRole)
    {
        // Verify supported staff roles are active and retain their creator audit value.
        var repository = new FakeUserRepository();
        var service = CreateService(repository);

        await service.CreateStaffAsync(
            "admin@example.com",
            new CreateStaffRequest("STAFF@example.com", "Strong@123", "Staff", "User", requestedRole),
            TestCancellation);

        var saved = Assert.Single(repository.Users);
        Assert.Equal(expectedRole, saved.Role);
        Assert.Equal(UserStatus.Active, saved.Status);
        Assert.Equal("staff@example.com", saved.Email);
        Assert.Equal("admin@example.com", saved.CreatedByIdentifier);
    }

    [Fact]
    public async Task RequestOwnDeactivation_KeepsProsumerActive()
    {
        // Verify Prosumer self-service records a request without changing account status.
        var repository = new FakeUserRepository();
        var user = Prosumer();
        repository.Users.Add(user);
        var service = CreateService(repository);

        await service.RequestOwnDeactivationAsync(user.Nic!, TestCancellation);

        Assert.Equal(UserStatus.Active, user.Status);
        Assert.True(user.DeactivationRequested);
        Assert.NotNull(user.DeactivationRequestedAtUtc);
    }

    [Fact]
    public async Task RequestOwnDeactivation_RejectsDuplicateRequest()
    {
        // Verify a Prosumer cannot create multiple pending deactivation requests.
        var repository = new FakeUserRepository();
        var user = Prosumer();
        user.DeactivationRequested = true;
        repository.Users.Add(user);
        var service = CreateService(repository);

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            service.RequestOwnDeactivationAsync(user.Nic!, TestCancellation));

        Assert.Equal("USER_DEACTIVATION_ALREADY_REQUESTED", exception.ErrorCode);
        Assert.Equal(UserStatus.Active, user.Status);
    }

    [Fact]
    public async Task DeactivateUser_WithNonTerminalReservation_IsRejected()
    {
        // Verify administrative deactivation retains the existing reservation safeguard.
        var repository = new FakeUserRepository();
        var user = Prosumer();
        user.DeactivationRequested = true;
        repository.Users.Add(user);
        var service = CreateService(repository, new BlockingDeactivationGuard());

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            service.DeactivateUserAsync("admin@example.com", user.Nic!, TestCancellation));

        Assert.Equal("USER_ACTIVE_RESERVATIONS", exception.ErrorCode);
        Assert.Equal(UserStatus.Active, user.Status);
        Assert.True(user.DeactivationRequested);
    }

    [Fact]
    public async Task ReactivateUser_RequiresDeactivatedState()
    {
        // Verify reactivation rejects accounts that are not deactivated.
        var repository = new FakeUserRepository();
        repository.Users.Add(Prosumer());
        var service = CreateService(repository);

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            service.ReactivateUserAsync("admin@example.com", "200012345678", TestCancellation));

        Assert.Equal("USER_INVALID_STATUS", exception.ErrorCode);
    }

    [Fact]
    public async Task ReactivateUser_RecordsActorAndTimestamp()
    {
        // Verify reactivation records the normalized administrator and timestamp.
        var repository = new FakeUserRepository();
        var user = Prosumer();
        user.Status = UserStatus.Deactivated;
        repository.Users.Add(user);
        var service = CreateService(repository);

        await service.ReactivateUserAsync("ADMIN@EXAMPLE.COM", user.Nic!, TestCancellation);

        Assert.Equal(UserStatus.Active, user.Status);
        Assert.Equal("admin@example.com", user.StatusChangedByIdentifier);
        Assert.NotNull(user.ReactivatedAtUtc);
    }

    [Fact]
    public async Task GetActiveProsumer_ReturnsOnlyActiveProsumer()
    {
        // Verify dependent modules can resolve an active Prosumer by normalized NIC.
        var repository = new FakeUserRepository();
        repository.Users.Add(Prosumer());
        var service = CreateService(repository);

        var result = await service.GetActiveProsumerAsync(" 200012345678 ", TestCancellation);

        Assert.Equal("200012345678", result.Nic);
        Assert.Equal("0771234567", result.PhoneNumber);
    }

    [Fact]
    public async Task GetActiveProsumer_RejectsDeactivatedProsumer()
    {
        // Verify dependent modules cannot use a deactivated Prosumer account.
        var repository = new FakeUserRepository();
        var user = Prosumer();
        user.Status = UserStatus.Deactivated;
        repository.Users.Add(user);
        var service = CreateService(repository);

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            service.GetActiveProsumerAsync(user.Nic!, TestCancellation));

        Assert.Equal("AUTH_ACCOUNT_INACTIVE", exception.ErrorCode);
    }

    [Fact]
    public async Task UpdateProfile_UpdatesProsumerContactFields()
    {
        // Verify a Prosumer can update supported contact fields.
        var repository = new FakeUserRepository();
        var user = Prosumer();
        repository.Users.Add(user);
        var service = CreateService(repository);

        var result = await service.UpdateProfileAsync(
            user.Nic!,
            new UpdateProfileRequest("Updated", "Name", "+94770000000", "Kandy"),
            TestCancellation);

        Assert.Equal("+94770000000", result.PhoneNumber);
        Assert.Equal("Kandy", result.Address);
    }

    [Fact]
    public async Task UpdateProsumer_UpdatesProfileAndPreservesIdentityLifecycleFields()
    {
        // Verify Backoffice can update contact data without changing NIC, role, status, or password.
        var repository = new FakeUserRepository();
        var user = Prosumer();
        user.Status = UserStatus.Deactivated;
        var originalPasswordHash = user.PasswordHash;
        repository.Users.Add(user);
        var service = CreateService(repository);

        var result = await service.UpdateProsumerAsync(
            "admin@example.com",
            " 200012345678 ",
            new UpdateProsumerRequest(
                "UPDATED@EXAMPLE.COM",
                "Updated",
                "Name",
                "+94770000000",
                "Kandy"),
            TestCancellation);

        Assert.Equal("200012345678", result.Nic);
        Assert.Equal("updated@example.com", result.Email);
        Assert.Equal("Updated", result.FirstName);
        Assert.Equal("+94770000000", result.PhoneNumber);
        Assert.Equal(UserRole.Prosumer, user.Role);
        Assert.Equal(UserStatus.Deactivated, user.Status);
        Assert.Equal(originalPasswordHash, user.PasswordHash);
    }

    [Fact]
    public async Task UpdateProsumer_RejectsEmailOwnedByAnotherAccount()
    {
        // Verify administrative updates preserve the global unique-email rule.
        var repository = new FakeUserRepository();
        var user = Prosumer();
        repository.Users.Add(user);
        repository.Users.Add(Staff("staff@example.com", UserRole.GridOperator));
        var service = CreateService(repository);

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            service.UpdateProsumerAsync(
                "admin@example.com",
                user.Nic!,
                new UpdateProsumerRequest(
                    "staff@example.com",
                    "Updated",
                    "Name",
                    "0771234567",
                    "Colombo"),
                TestCancellation));

        Assert.Equal(StatusCodes.Status409Conflict, exception.StatusCode);
        Assert.Equal("USER_EMAIL_EXISTS", exception.ErrorCode);
    }

    [Fact]
    public async Task ChangePassword_ReplacesHashAndAllowsNewPassword()
    {
        // Verify password changes replace the hash with one matching the new secret.
        var repository = new FakeUserRepository();
        var user = Prosumer();
        repository.Users.Add(user);
        var service = CreateService(repository);

        await service.ChangePasswordAsync(
            user.Nic!,
            new ChangePasswordRequest("Strong@123", "NewStrong@456"),
            TestCancellation);

        Assert.False(BCrypt.Net.BCrypt.Verify("Strong@123", user.PasswordHash));
        Assert.True(BCrypt.Net.BCrypt.Verify("NewStrong@456", user.PasswordHash));
    }

    [Fact]
    public async Task ChangePassword_RejectsIncorrectCurrentPassword()
    {
        // Verify password replacement requires the correct current password.
        var repository = new FakeUserRepository();
        var user = Prosumer();
        repository.Users.Add(user);
        var service = CreateService(repository);

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            service.ChangePasswordAsync(
                user.Nic!,
                new ChangePasswordRequest("Wrong@123", "NewStrong@456"),
                TestCancellation));

        Assert.Equal("AUTH_CURRENT_PASSWORD_INVALID", exception.ErrorCode);
    }

    [Fact]
    public async Task ChangePassword_RejectsCurrentPasswordAsNewPassword()
    {
        // Verify the current password cannot be reused as the new password.
        var repository = new FakeUserRepository();
        var user = Prosumer();
        repository.Users.Add(user);
        var service = CreateService(repository);

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            service.ChangePasswordAsync(
                user.Nic!,
                new ChangePasswordRequest("Strong@123", "Strong@123"),
                TestCancellation));

        Assert.Equal("AUTH_PASSWORD_UNCHANGED", exception.ErrorCode);
    }

    [Fact]
    public async Task DeactivateUser_RejectsSelfDeactivationByBackoffice()
    {
        // Verify a Backoffice user cannot disable their own administrative session.
        var repository = new FakeUserRepository();
        repository.Users.Add(Staff("admin@example.com", UserRole.Backoffice));
        var service = CreateService(repository);

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            service.DeactivateUserAsync("ADMIN@example.com", "admin@example.com", TestCancellation));

        Assert.Equal("USER_SELF_ADMIN_DEACTIVATION", exception.ErrorCode);
    }

    [Fact]
    public async Task DeactivateUser_PreservesFinalActiveBackofficeAccount()
    {
        // Verify the system always retains at least one active Backoffice account.
        var repository = new FakeUserRepository();
        repository.Users.Add(Staff("admin1@example.com", UserRole.Backoffice));
        repository.Users.Add(Staff("operator@example.com", UserRole.GridOperator));
        var service = CreateService(repository);

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            service.DeactivateUserAsync("admin2@example.com", "admin1@example.com", TestCancellation));

        Assert.Equal("USER_LAST_ADMIN", exception.ErrorCode);
    }

    // Build the identity service with deterministic test doubles.
    private static IdentityService CreateService(
        FakeUserRepository repository,
        IAccountDeactivationGuard? deactivationGuard = null) =>
        new(
            repository,
            new FakeTokenGenerator(),
            deactivationGuard ?? new AllowDeactivationGuard(),
            NullLogger<IdentityService>.Instance);

    // Use the xUnit test cancellation token for asynchronous test operations.
    private static CancellationToken TestCancellation => TestContext.Current.CancellationToken;

    // Create the standard active Prosumer fixture.
    private static User Prosumer() => new()
    {
        Nic = "200012345678",
        Email = "prosumer@example.com",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Strong@123"),
        FirstName = "Test",
        LastName = "Prosumer",
        PhoneNumber = "0771234567",
        Address = "Colombo",
        Role = UserRole.Prosumer,
        Status = UserStatus.Active
    };

    // Create a standard active staff fixture for the requested role.
    private static User Staff(string email, UserRole role) => new()
    {
        Email = email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Strong@123"),
        FirstName = "Test",
        LastName = "Staff",
        Role = role,
        Status = UserStatus.Active
    };

    private sealed class FakeTokenGenerator : IJwtTokenGenerator
    {
        // Return a deterministic token value without signing cryptographic material.
        public AccessTokenResult GenerateToken(User user) =>
            new("test-token", DateTime.UtcNow.AddHours(1));
    }

    private sealed class AllowDeactivationGuard : IAccountDeactivationGuard
    {
        // Allow status changes for tests unrelated to reservation blocking.
        public Task EnsureCanDeactivateAsync(
            string prosumerNic,
            CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class BlockingDeactivationGuard : IAccountDeactivationGuard
    {
        // Simulate a non-terminal reservation conflict.
        public Task EnsureCanDeactivateAsync(
            string prosumerNic,
            CancellationToken cancellationToken = default) =>
            throw IdentityException.Conflict(
                "USER_ACTIVE_RESERVATIONS",
                "The account cannot be deactivated while it has non-terminal reservations.");
    }

    private sealed class FakeUserRepository : IUserRepository
    {
        public List<User> Users { get; } = [];

        // Resolve a fixture account by NIC.
        public Task<User?> FindByNicAsync(string nic, CancellationToken cancellationToken = default) =>
            Task.FromResult(Users.SingleOrDefault(user => user.Nic == nic));

        // Resolve a fixture account by email.
        public Task<User?> FindByEmailAsync(string email, CancellationToken cancellationToken = default) =>
            Task.FromResult(Users.SingleOrDefault(user => user.Email == email));

        // Resolve a fixture account by either supported business identifier.
        public Task<User?> FindByIdentifierAsync(string identifier, CancellationToken cancellationToken = default) =>
            Task.FromResult(Users.SingleOrDefault(user => user.Email == identifier || user.Nic == identifier));

        // Return a copy of the in-memory account list.
        public Task<List<User>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(Users.ToList());

        public Task<List<User>> GetProsumersByStatusAsync(
            UserStatus status,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Users.Where(user =>
                user.Role == UserRole.Prosumer && user.Status == status).ToList());

        // Count active Backoffice fixtures for final-admin protection tests.
        public Task<long> CountActiveBackofficeAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult((long)Users.Count(user =>
                user.Role == UserRole.Backoffice && user.Status == UserStatus.Active));

        public Task CreateAsync(User user, CancellationToken cancellationToken = default)
        {
            // Simulate repository timestamps before retaining the account fixture.
            user.CreatedAtUtc = DateTime.UtcNow;
            user.UpdatedAtUtc = user.CreatedAtUtc;
            Users.Add(user);
            return Task.CompletedTask;
        }

        // Keep object-reference updates without additional persistence work.
        public Task UpdateAsync(User user, CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task<bool> UpdateStatusAsync(
            string identifier,
            UserStatus expectedStatus,
            UserStatus status,
            string changedByIdentifier,
            DateTime changedAtUtc,
            CancellationToken cancellationToken = default,
            string? rejectionReason = null)
        {
            // Simulate an atomic expected-status transition and its audit fields.
            var user = Users.SingleOrDefault(item => item.Email == identifier || item.Nic == identifier);
            if (user is null || user.Status != expectedStatus)
            {
                return Task.FromResult(false);
            }

            user.Status = status;
            user.StatusChangedByIdentifier = changedByIdentifier;
            user.UpdatedAtUtc = changedAtUtc;
            if (status == UserStatus.Deactivated)
            {
                user.DeactivatedAtUtc = changedAtUtc;
                user.DeactivationRequested = false;
                user.DeactivationRequestedAtUtc = null;
            }
            else if (status == UserStatus.Active && expectedStatus == UserStatus.Deactivated)
            {
                user.ReactivatedAtUtc = changedAtUtc;
            }
            else if (status == UserStatus.Rejected)
            {
                user.RejectionReason = rejectionReason;
                user.RejectedAtUtc = changedAtUtc;
            }
            return Task.FromResult(true);
        }

        public Task<bool> RequestDeactivationAsync(
            string nic,
            DateTime requestedAtUtc,
            CancellationToken cancellationToken = default)
        {
            var user = Users.SingleOrDefault(item => item.Nic == nic);
            if (user is null || user.Role != UserRole.Prosumer ||
                user.Status != UserStatus.Active || user.DeactivationRequested)
            {
                return Task.FromResult(false);
            }

            user.DeactivationRequested = true;
            user.DeactivationRequestedAtUtc = requestedAtUtc;
            return Task.FromResult(true);
        }

        public Task RecordSuccessfulLoginAsync(
            string identifier,
            DateTime loginAtUtc,
            CancellationToken cancellationToken = default)
        {
            // Record successful-login metadata on the matching fixture account.
            var user = Users.Single(item => item.Email == identifier || item.Nic == identifier);
            user.LastLoginAtUtc = loginAtUtc;
            return Task.CompletedTask;
        }
    }
}
