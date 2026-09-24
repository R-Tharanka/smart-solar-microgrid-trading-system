using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using SmartSolarMicrogrid.Api.Configuration;
using SmartSolarMicrogrid.Api.Infrastructure;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Tests;

public sealed class JwtTokenGeneratorTests
{
    [Fact]
    public void GenerateToken_UsesBusinessIdentifierAndRequiredClaims()
    {
        var options = Options.Create(new JwtOptions
        {
            Issuer = "test-issuer",
            Audience = "test-audience",
            SigningKey = "a-test-signing-key-that-is-at-least-32-bytes-long",
            AccessTokenMinutes = 30
        });
        var user = new User
        {
            Nic = "200012345678",
            Email = "prosumer@example.com",
            Role = UserRole.Prosumer,
            Status = UserStatus.Active
        };

        var result = new JwtTokenGenerator(options).GenerateToken(user);
        var token = new JwtSecurityTokenHandler().ReadJwtToken(result.Token);

        Assert.Equal("200012345678", token.Subject);
        Assert.Equal("prosumer@example.com", token.Claims.Single(claim => claim.Type == JwtRegisteredClaimNames.Email).Value);
        Assert.Equal("Prosumer", token.Claims.Single(claim => claim.Type == ClaimTypes.Role).Value);
        Assert.Equal("200012345678", token.Claims.Single(claim => claim.Type == "user_identifier").Value);
        Assert.NotNull(token.Claims.SingleOrDefault(claim => claim.Type == JwtRegisteredClaimNames.Jti));
        Assert.InRange(result.ExpiresAtUtc, DateTime.UtcNow.AddMinutes(29), DateTime.UtcNow.AddMinutes(31));
    }
}
