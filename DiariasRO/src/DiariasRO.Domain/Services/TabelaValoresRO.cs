using DiariasRO.Domain.Enums;

namespace DiariasRO.Domain.Services;

public static class TabelaValoresRO
{
    public static decimal ObterValorBase(CategoriaCargo categoria, TipoViagem tipo) => (categoria, tipo) switch
    {
        (CategoriaCargo.GovernadorVice, TipoViagem.Nacional) => 713.00m,
        (CategoriaCargo.GovernadorVice, TipoViagem.Internacional) => 741.00m,

        (CategoriaCargo.SecretarioEquivalente, TipoViagem.Nacional) => 623.00m,
        (CategoriaCargo.SecretarioEquivalente, TipoViagem.Internacional) => 593.00m,

        (CategoriaCargo.GerenciaSuperiorProcurador, TipoViagem.Nacional) => 534.00m,
        (CategoriaCargo.GerenciaSuperiorProcurador, TipoViagem.Internacional) => 474.00m,

        (CategoriaCargo.GerenciaIntermediariaEDemais, TipoViagem.Nacional) => 445.00m,
        (CategoriaCargo.GerenciaIntermediariaEDemais, TipoViagem.Internacional) => 474.00m,

        _ => throw new ArgumentOutOfRangeException(nameof(categoria), "Categoria ou tipo inválido.")
    };
}