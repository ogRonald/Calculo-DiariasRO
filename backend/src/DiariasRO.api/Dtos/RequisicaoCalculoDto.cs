using DiariasRO.Domain.Enums;

namespace DiariasRO.api.Dtos;

public record RequisicaoCalculoDto(
    CategoriaCargo Categoria,
    DateTime DataHoraInicio,
    DateTime DataHoraFim,
    TipoViagem Tipo,
    decimal? CotacaoDolar,
    bool HospedagemInclusa,
    bool CustosTotaisTerceiros,
    string TipoRegra,
    CategoriaCargo? CategoriaAutoridadeAcompanhada = null
);