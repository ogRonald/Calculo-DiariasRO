# Usa a imagem oficial do .NET 10 como base
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

# Usa o SDK para compilar o código
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copia os arquivos da API e do Domínio
COPY ["src/DiariasRO.Api/DiariasRO.Api.csproj", "src/DiariasRO.Api/"]
COPY ["src/DiariasRO.Domain/DiariasRO.Domain.csproj", "src/DiariasRO.Domain/"]
RUN dotnet restore "src/DiariasRO.Api/DiariasRO.Api.csproj"

# Copia o resto do código e publica
COPY . .
WORKDIR "/src/src/DiariasRO.Api"
RUN dotnet publish "DiariasRO.Api.csproj" -c Release -o /app/publish

# Configura a caixa final pronta para rodar
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "DiariasRO.Api.dll"]