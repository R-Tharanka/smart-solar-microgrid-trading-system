using System.ComponentModel.DataAnnotations;
using SmartSolarMicrogrid.Api.Contracts.Identity;

namespace SmartSolarMicrogrid.Api.Tests;

public sealed class RequestValidationTests
{
    [Theory]
    [InlineData("123456789V", true)]
    [InlineData("200012345678", true)]
    [InlineData("1234", false)]
    [InlineData("123456789A", false)]
    public void RegisterProsumer_ValidatesSriLankanNic(string nic, bool expectedValid)
    {
        var request = new RegisterProsumerRequest(
            nic,
            "person@example.com",
            "Strong@123",
            "Test",
            "User",
            "0771234567",
            "Colombo");

        Assert.Equal(expectedValid, IsValid(request));
    }

    [Theory]
    [InlineData("Strong@123", true)]
    [InlineData("weakpassword", false)]
    [InlineData("NoSpecial123", false)]
    [InlineData("NoNumber@", false)]
    [InlineData("HASNOLOWER@123", false)]
    public void RegisterProsumer_ValidatesPasswordComplexity(string password, bool expectedValid)
    {
        var request = new RegisterProsumerRequest(
            "200012345678",
            "person@example.com",
            password,
            "Test",
            "User",
            "0771234567",
            "Colombo");

        Assert.Equal(expectedValid, IsValid(request));
    }

    [Theory]
    [InlineData("0771234567", true)]
    [InlineData("+94771234567", true)]
    [InlineData("123", false)]
    [InlineData("077-123-4567", false)]
    public void RegisterProsumer_ValidatesPhoneNumber(string phoneNumber, bool expectedValid)
    {
        var request = new RegisterProsumerRequest(
            "200012345678",
            "person@example.com",
            "Strong@123",
            "Test",
            "User",
            phoneNumber,
            "Colombo");

        Assert.Equal(expectedValid, IsValid(request));
    }

    private static bool IsValid(object request)
    {
        var results = new List<ValidationResult>();
        return Validator.TryValidateObject(request, new ValidationContext(request), results, true);
    }
}
