using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.Contracts.Identity;

public static class IdentityValidationRules
{
    public const string PasswordPattern = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,128}$";
    public const string PasswordError = "Password must contain an uppercase letter, lowercase letter, number, and special character, with no spaces.";
    public const string PhonePattern = @"^\+?[0-9]{9,15}$";
    public const string PhoneError = "Phone number must contain 9 to 15 digits and may start with +.";
}

public record LoginRequest(
    [property: Required, StringLength(320, MinimumLength = 3)] string Identifier,
    [property: Required, StringLength(128)] string Password);

public record RegisterProsumerRequest(
    [property: Required, RegularExpression(@"^(?:\d{9}[VvXx]|\d{12})$", ErrorMessage = "NIC must be 12 digits or 9 digits followed by V or X.")] string Nic,
    [property: Required, EmailAddress, StringLength(320)] string Email,
    [property: Required, StringLength(128, MinimumLength = 8), RegularExpression(IdentityValidationRules.PasswordPattern, ErrorMessage = IdentityValidationRules.PasswordError)] string Password,
    [property: Required, StringLength(100, MinimumLength = 1)] string FirstName,
    [property: Required, StringLength(100, MinimumLength = 1)] string LastName,
    [property: Required, RegularExpression(IdentityValidationRules.PhonePattern, ErrorMessage = IdentityValidationRules.PhoneError)] string PhoneNumber,
    [property: Required, StringLength(300, MinimumLength = 3)] string Address);

public record CreateStaffRequest(
    [property: Required, EmailAddress, StringLength(320)] string Email,
    [property: Required, StringLength(128, MinimumLength = 8), RegularExpression(IdentityValidationRules.PasswordPattern, ErrorMessage = IdentityValidationRules.PasswordError)] string Password,
    [property: Required, StringLength(100, MinimumLength = 1)] string FirstName,
    [property: Required, StringLength(100, MinimumLength = 1)] string LastName,
    [property: Required, RegularExpression("^(Backoffice|GridOperator)$", ErrorMessage = "Role must be Backoffice or GridOperator.")] string Role);

public record UpdateProfileRequest(
    [property: Required, StringLength(100, MinimumLength = 1)] string FirstName,
    [property: Required, StringLength(100, MinimumLength = 1)] string LastName,
    [property: RegularExpression(IdentityValidationRules.PhonePattern, ErrorMessage = IdentityValidationRules.PhoneError)] string? PhoneNumber = null,
    [property: StringLength(300, MinimumLength = 3)] string? Address = null);

public record ChangePasswordRequest(
    [property: Required, StringLength(128)] string CurrentPassword,
    [property: Required, StringLength(128, MinimumLength = 8), RegularExpression(IdentityValidationRules.PasswordPattern, ErrorMessage = IdentityValidationRules.PasswordError)] string NewPassword);
