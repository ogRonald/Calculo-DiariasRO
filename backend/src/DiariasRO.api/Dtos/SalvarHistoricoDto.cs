namespace DiariasRO.api.Dtos;

public record SalvarHistoricoDto(
    Guid UsuarioId,
    string Destino,
    DateTime DataHoraInicio,
    DateTime DataHoraFim,
    int TotalDias,
    decimal ValorUnitarioBrl,
    decimal ValorTotalBrl
);
