// -----------------------------------------------------------------------------
// File: TransactionRequestValidationTests.cs
// Member 4: Operator Verification and Transactions
// Purpose: Verifies MVC validation metadata for transaction request records.
// -----------------------------------------------------------------------------
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using SmartSolarMicrogrid.Api.Contracts.Transactions;

namespace SmartSolarMicrogrid.Api.Tests;

public sealed class TransactionRequestValidationTests
{
    [Fact]
    public void VerifyRequest_UsesConstructorParameterValidationMetadata()
    {
        var modelState = ValidateWithMvc(new VerifyTransactionRequest("R", "short"));

        Assert.False(modelState.IsValid);
        Assert.Contains(modelState.Keys, key => key.EndsWith("ReservationCode", StringComparison.Ordinal));
        Assert.Contains(modelState.Keys, key => key.EndsWith("TransactionToken", StringComparison.Ordinal));
    }

    [Fact]
    public void FinalizeRequest_UsesConstructorParameterValidationMetadata()
    {
        var modelState = ValidateWithMvc(new FinalizeTransactionRequest("R", "", 0));

        Assert.False(modelState.IsValid);
        Assert.Contains(modelState.Keys, key => key.EndsWith("ReservationCode", StringComparison.Ordinal));
        Assert.Contains(modelState.Keys, key => key.EndsWith("ConfirmationNote", StringComparison.Ordinal));
        Assert.Contains(modelState.Keys, key => key.EndsWith("ActualEnergyTransferredKwh", StringComparison.Ordinal));
    }

    private static ModelStateDictionary ValidateWithMvc(object request)
    {
        var services = new ServiceCollection()
            .AddLogging()
            .AddControllers()
            .Services
            .BuildServiceProvider();
        using (services)
        {
            var modelState = new ModelStateDictionary();
            var actionContext = new ActionContext(
                new DefaultHttpContext { RequestServices = services },
                new RouteData(),
                new ActionDescriptor(),
                modelState);

            services.GetRequiredService<IObjectModelValidator>()
                .Validate(actionContext, validationState: null, prefix: string.Empty, model: request);

            return modelState;
        }
    }
}
