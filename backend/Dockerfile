FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/SmartSolarMicrogrid.Api/SmartSolarMicrogrid.Api.csproj src/SmartSolarMicrogrid.Api/
RUN dotnet restore src/SmartSolarMicrogrid.Api/SmartSolarMicrogrid.Api.csproj
COPY . .
RUN dotnet publish src/SmartSolarMicrogrid.Api/SmartSolarMicrogrid.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app .
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "SmartSolarMicrogrid.Api.dll"]
