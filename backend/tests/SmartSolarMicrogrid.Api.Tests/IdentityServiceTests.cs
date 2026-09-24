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
        Assert.Equal(UserStatus.Active, saved.Status);
        Assert.True(BCrypt.Net.BCrypt.Verify("Strong@123", saved.PasswordHash));
        Assert.NotEqual("Strong@123", saved.PasswordHash);
        Assert.Equal("person@example.com", response.Email);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task RegisterProsumer_RejectsDuplicateIdentifiers(bool duplicateNic)
    {
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
    public async Task Authenticate_WithActiveAccount_ReturnsTokenAndRecordsLogin()
    {
        var repository = new FakeUserRepository();
        repository.Users.Add(Prosumer());
        var service = CreateService(repository);

        var response = await service.AuthenticateAsync(
            new LoginRequest(" PROSUMER@EXAMPLE.COM ", "Strong@123"),
            TestCancellation);

        Assert.Equal("test-token", response.AccessToken);
        Assert.NotNull(repository.Users[0].LastLoginAtUtc);
    }

    [Fact]
    public async Task Authenticate_WithWrongPassword_ReturnsGenericUnauthorizedError()
    {
        var repository = new FakeUserRepository();
        repository.Users.Add(Prosumer());
        var service = CreateService(repository);

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            service.AuthenticateAsync(new LoginRequest("prosumer@example.com", "Wrong@123"), TestCancellation));

        Assert.Equal(StatusCodes.Status401Unauthorized, exception.StatusCode);
        Assert.Equal("AUTH_INVALID_CREDENTIALS", exception.ErrorCode);
    }

    [Fact]
    public async Task Authenticate_WithUnknownAccount_ReturnsGenericUnauthorizedError()
    {
        var service = CreateService(new FakeUserRepository());

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            service.AuthenticateAsync(
                new LoginRequest("unknown@example.com", "Strong@123"),
                TestCancellation));

        Assert.Equal(StatusCodes.Status401Unauthorized, exception.StatusCode);
        Assert.Equal("AUTH_INVALID_CREDENTIALS", exception.ErrorCode);
    }

    [Theory]
    [InlineData(UserStatus.Pending)]
    [InlineData(UserStatus.Deactivated)]
    public async Task Authenticate_WithInactiveAccount_IsForbidden(UserStatus status)
    {
        var repository = new FakeUserRepository();
        var user = Prosumer();
        user.Status = status;
        repository.Users.Add(user);
        var service = CreateService(repository);

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            service.AuthenticateAsync(new LoginRequest(user.Nic!, "Strong@123"), TestCancellation));

        Assert.Equal(StatusCodes.Status403Forbidden, exception.StatusCode);
        Assert.Equal("AUTH_ACCOUNT_INACTIVE", exception.ErrorCode);
    }

    [Fact]
    public async Task CreateStaff_RejectsProsumerRole()
    {
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
    public async Task DeactivateOwnAccount_ChangesOnlyActiveProsumer()
    {
        var repository = new FakeUserRepository();
        var user = Prosumer();
        repository.Users.Add(user);
        var service = CreateService(repository);

        await service.DeactivateOwnAccountAsync(user.Nic!, TestCancellation);

        Assert.Equal(UserStatus.Deactivated, user.Status);
        Assert.Equal(user.Nic, user.StatusChangedByIdentifier);
        Assert.NotNull(user.DeactivatedAtUtc);
    }

    [Fact]
    public async Task DeactivateOwnAccount_WithNonTerminalReservation_IsRejected()
    {
        var repository = new FakeUserRepository();
        var user = Prosumer();
        repository.Users.Add(user);
        var service = CreateService(repository, new BlockingDeactivationGuard());

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            service.DeactivateOwnAccountAsync(user.Nic!, TestCancellation));

        Assert.Equal("USER_ACTIVE_RESERVATIONS", exception.ErrorCode);
        Assert.Equal(UserStatus.Active, user.Status);
    }

    [Fact]
    public async Task ReactivateUser_RequiresDeactivatedState()
    {
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
    public async Task ChangePassword_ReplacesHashAndAllowsNewPassword()
    {
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
        var repository = new FakeUserRepository();
        repository.Users.Add(Staff("admin1@example.com", UserRole.Backoffice));
        repository.Users.Add(Staff("operator@example.com", UserRole.GridOperator));
        var service = CreateService(repository);

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            service.DeactivateUserAsync("admin2@example.com", "admin1@example.com", TestCancellation));

        Assert.Equal("USER_LAST_ADMIN", exception.ErrorCode);
    }

    private static IdentityService CreateService(
        FakeUserRepository repository,
        IAccountDeactivationGuard? deactivationGuard = null) =>
        new(
            repository,
            new FakeTokenGenerator(),
            deactivationGuard ?? new AllowDeactivationGuard(),
            NullLogger<IdentityService>.Instance);

    private static CancellationToken TestCancellation => TestContext.Current.CancellationToken;

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
        public AccessTokenResult GenerateToken(User user) =>
            new("test-token", DateTime.UtcNow.AddHours(1));
    }

    private sealed class AllowDeactivationGuard : IAccountDeactivationGuard
    {
        public Task EnsureCanDeactivateAsync(
            string prosumerNic,
            CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class BlockingDeactivationGuard : IAccountDeactivationGuard
    {
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

        public Task<User?> FindByNicAsync(string nic, CancellationToken cancellationToken = default) =>
            Task.FromResult(Users.SingleOrDefault(user => user.Nic == nic));

        public Task<User?> FindByEmailAsync(string email, CancellationToken cancellationToken = default) =>
            Task.FromResult(Users.SingleOrDefault(user => user.Email == email));

        public Task<User?> FindByIdentifierAsync(string identifier, CancellationToken cancellationToken = default) =>
            Task.FromResult(Users.SingleOrDefault(user => user.Email == identifier || user.Nic == identifier));

        public Task<List<User>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(Users.ToList());

        public Task<long> CountActiveBackofficeAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult((long)Users.Count(user =>
                user.Role == UserRole.Backoffice && user.Status == UserStatus.Active));

        public Task CreateAsync(User user, CancellationToken cancellationToken = default)
        {
            user.CreatedAtUtc = DateTime.UtcNow;
            user.UpdatedAtUtc = user.CreatedAtUtc;
            Users.Add(user);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(User user, CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task<bool> UpdateStatusAsync(
            string identifier,
            UserStatus expectedStatus,
            UserStatus status,
            string changedByIdentifier,
            DateTime changedAtUtc,
            CancellationToken cancellationToken = default)
        {
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
            }
            else
            {
                user.ReactivatedAtUtc = changedAtUtc;
            }
            return Task.FromResult(true);
        }

        public Task RecordSuccessfulLoginAsync(
            string identifier,
            DateTime loginAtUtc,
            CancellationToken cancellationToken = default)
        {
            var user = Users.Single(item => item.Email == identifier || item.Nic == identifier);
            user.LastLoginAtUtc = loginAtUtc;
            return Task.CompletedTask;
        }
    }
}
