using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.Contracts.Identity;

public static class IdentityValidationRules
{
    public const string PasswordPattern = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,128}$";
    public const string PasswordError = "Password must contain an uppercase letter, lowercase letter, number, and special character, with no spaces.";
    public const string PhonePattern = @"^\+?[0-9]{9,15}$";
    public const string PhoneError = "Phone number must contain 9 to 15 digits and may start with +.";
}

public sealed class LoginRequest
{
    public LoginRequest()
    {
    }

    public LoginRequest(string identifier, string password) =>
        (Identifier, Password) = (identifier, password);

    [Required, StringLength(320, MinimumLength = 3)]
    public string Identifier { get; init; } = string.Empty;

    [Required, StringLength(128)]
    public string Password { get; init; } = string.Empty;
}

public sealed class RegisterProsumerRequest
{
    public RegisterProsumerRequest()
    {
    }

    public RegisterProsumerRequest(
        string nic,
        string email,
        string password,
        string firstName,
        string lastName,
        string phoneNumber,
        string address) =>
        (Nic, Email, Password, FirstName, LastName, PhoneNumber, Address) =
        (nic, email, password, firstName, lastName, phoneNumber, address);

    [Required, RegularExpression(@"^(?:\d{9}[VvXx]|\d{12})$", ErrorMessage = "NIC must be 12 digits or 9 digits followed by V or X.")]
    public string Nic { get; init; } = string.Empty;

    [Required, EmailAddress, StringLength(320)]
    public string Email { get; init; } = string.Empty;

    [Required, StringLength(128, MinimumLength = 8), RegularExpression(IdentityValidationRules.PasswordPattern, ErrorMessage = IdentityValidationRules.PasswordError)]
    public string Password { get; init; } = string.Empty;

    [Required, StringLength(100, MinimumLength = 1)]
    public string FirstName { get; init; } = string.Empty;

    [Required, StringLength(100, MinimumLength = 1)]
    public string LastName { get; init; } = string.Empty;

    [Required, RegularExpression(IdentityValidationRules.PhonePattern, ErrorMessage = IdentityValidationRules.PhoneError)]
    public string PhoneNumber { get; init; } = string.Empty;

    [Required, StringLength(300, MinimumLength = 3)]
    public string Address { get; init; } = string.Empty;
}

public sealed class CreateStaffRequest
{
    public CreateStaffRequest()
    {
    }

    public CreateStaffRequest(
        string email,
        string password,
        string firstName,
        string lastName,
        string role) =>
        (Email, Password, FirstName, LastName, Role) =
        (email, password, firstName, lastName, role);

    [Required, EmailAddress, StringLength(320)]
    public string Email { get; init; } = string.Empty;

    [Required, StringLength(128, MinimumLength = 8), RegularExpression(IdentityValidationRules.PasswordPattern, ErrorMessage = IdentityValidationRules.PasswordError)]
    public string Password { get; init; } = string.Empty;

    [Required, StringLength(100, MinimumLength = 1)]
    public string FirstName { get; init; } = string.Empty;

    [Required, StringLength(100, MinimumLength = 1)]
    public string LastName { get; init; } = string.Empty;

    [Required, RegularExpression("^(Backoffice|GridOperator)$", ErrorMessage = "Role must be Backoffice or GridOperator.")]
    public string Role { get; init; } = string.Empty;
}

public sealed class UpdateProfileRequest
{
    public UpdateProfileRequest()
    {
    }

    public UpdateProfileRequest(
        string firstName,
        string lastName,
        string? phoneNumber = null,
        string? address = null) =>
        (FirstName, LastName, PhoneNumber, Address) =
        (firstName, lastName, phoneNumber, address);

    [Required, StringLength(100, MinimumLength = 1)]
    public string FirstName { get; init; } = string.Empty;

    [Required, StringLength(100, MinimumLength = 1)]
    public string LastName { get; init; } = string.Empty;

    [RegularExpression(IdentityValidationRules.PhonePattern, ErrorMessage = IdentityValidationRules.PhoneError)]
    public string? PhoneNumber { get; init; }

    [StringLength(300, MinimumLength = 3)]
    public string? Address { get; init; }
}

public sealed class ChangePasswordRequest
{
    public ChangePasswordRequest()
    {
    }

    public ChangePasswordRequest(string currentPassword, string newPassword) =>
        (CurrentPassword, NewPassword) = (currentPassword, newPassword);

    [Required, StringLength(128)]
    public string CurrentPassword { get; init; } = string.Empty;

    [Required, StringLength(128, MinimumLength = 8), RegularExpression(IdentityValidationRules.PasswordPattern, ErrorMessage = IdentityValidationRules.PasswordError)]
    public string NewPassword { get; init; } = string.Empty;
}
