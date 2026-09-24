namespace SmartSolarMicrogrid.Api.Contracts.Identity;

public record LoginResponse(
    string AccessToken,
    DateTime ExpiresAtUtc,
    UserResponse User);

public record UserResponse(
    string? Nic,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    string Status);
