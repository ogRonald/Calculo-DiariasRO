namespace DiariasRO.api.Dtos;

public record PerfilDto(
    Guid Id,
    string Matricula,
    string Orgao,
    string NomeCompleto,
    string Funcao,
    string Email,
    string Celular
);

public record AtualizarPerfilDto(
    string NomeCompleto,
    string Funcao,
    string Email,
    string Celular,
    string? Senha
);
