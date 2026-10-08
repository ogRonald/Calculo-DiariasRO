namespace DiariasRO.api.Models;

public class Usuario
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Matricula { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
    public string Orgao { get; set; } = string.Empty;
    public string NomeCompleto { get; set; } = string.Empty;
    public string Funcao { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Celular { get; set; } = string.Empty;
    public ICollection<HistoricoCalculo> Historicos { get; set; } = new List<HistoricoCalculo>();
}
