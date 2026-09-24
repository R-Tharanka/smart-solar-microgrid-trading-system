using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using SmartSolarMicrogrid.Api.Authorization;
using SmartSolarMicrogrid.Api.Configuration;
using SmartSolarMicrogrid.Api.Infrastructure;
using SmartSolarMicrogrid.Api.Middleware;
using SmartSolarMicrogrid.Api.Persistence;
using SmartSolarMicrogrid.Api.Persistence.Repositories;
using SmartSolarMicrogrid.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddOptions<MongoDbOptions>()
    .Bind(builder.Configuration.GetSection(MongoDbOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();
builder.Services
    .AddOptions<JwtOptions>()
    .Bind(builder.Configuration.GetSection(JwtOptions.SectionName))
    .ValidateDataAnnotations()
    .Validate(options => Encoding.UTF8.GetByteCount(options.SigningKey) >= 32,
        "JWT signing key must be at least 32 bytes.")
    .ValidateOnStart();
builder.Services
    .AddOptions<BootstrapAdminOptions>()
    .Bind(builder.Configuration.GetSection(BootstrapAdminOptions.SectionName))
    .Validate(options => !options.Enabled ||
        (!string.IsNullOrWhiteSpace(options.Email) &&
         !string.IsNullOrWhiteSpace(options.Password) &&
         !string.IsNullOrWhiteSpace(options.FirstName) &&
         !string.IsNullOrWhiteSpace(options.LastName)),
        "Bootstrap administrator email, password, first name, and last name are required when bootstrapping is enabled.")
    .Validate(options => !options.Enabled ||
        new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(options.Email),
        "Bootstrap administrator email must be valid.")
    .Validate(options => !options.Enabled ||
        System.Text.RegularExpressions.Regex.IsMatch(
            options.Password,
            SmartSolarMicrogrid.Api.Contracts.Identity.IdentityValidationRules.PasswordPattern),
        SmartSolarMicrogrid.Api.Contracts.Identity.IdentityValidationRules.PasswordError)
    .ValidateOnStart();
builder.Services
    .AddOptions<CorsOptions>()
    .Bind(builder.Configuration.GetSection(CorsOptions.SectionName))
    .ValidateDataAnnotations()
    .Validate(options => options.AllowedOrigins.All(origin =>
        Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
        (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)),
        "Every CORS origin must be an absolute HTTP or HTTPS URL.")
    .ValidateOnStart();

var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException("JWT configuration is missing.");
var cors = builder.Configuration.GetSection(CorsOptions.SectionName).Get<CorsOptions>()
    ?? throw new InvalidOperationException("CORS configuration is missing.");

builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddSingleton<MongoCollectionInitializer>();
builder.Services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ISolarStationRepository, SolarStationRepository>();
builder.Services.AddScoped<IBookingSlotRepository, BookingSlotRepository>();
builder.Services.AddScoped<IAccountDeactivationGuard, ReservationAccountDeactivationGuard>();
builder.Services.AddScoped<IReservationQueryService, ReservationQueryService>();
builder.Services.AddScoped<IIdentityService, IdentityService>();
builder.Services.AddScoped<ISolarStationService, SolarStationService>();
builder.Services.AddScoped<IBookingSlotService, BookingSlotService>();
builder.Services.AddScoped<IAuthorizationHandler, ActiveUserHandler>();
builder.Services.AddHealthChecks().AddCheck<MongoDbHealthCheck>("mongodb");
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var problem = new ValidationProblemDetails(context.ModelState)
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Request validation failed",
                Detail = "One or more request fields are invalid.",
                Instance = context.HttpContext.Request.Path
            };
            problem.Extensions["errorCode"] = "VALIDATION_REQUEST";
            problem.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
            return new BadRequestObjectResult(problem);
        };
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsOptions.ClientApplicationsPolicy, policy =>
        policy.WithOrigins(cors.AllowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
builder.Services.AddAuthorization(AuthorizationPolicies.Configure);

var app = builder.Build();

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseHttpsRedirection();
app.UseCors(CorsOptions.ClientApplicationsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = _ => true });

await app.Services.GetRequiredService<MongoCollectionInitializer>()
    .InitializeAsync(app.Lifetime.ApplicationStopping);

app.Run();

public partial class Program;
