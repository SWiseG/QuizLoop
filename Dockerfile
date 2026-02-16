FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

COPY backend/ .
RUN dotnet restore QuizLoop.slnx
RUN dotnet publish QuizLoop.Api/QuizLoop.Api.csproj -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app
COPY --from=build /app/out .

ENV ASPNETCORE_URLS=http://0.0.0.0:10000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 10000
ENTRYPOINT ["dotnet", "QuizLoop.Api.dll"]
