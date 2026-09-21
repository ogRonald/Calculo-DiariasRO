namespace DiariasRO.api.Models;

public class HistoricoCalculo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public string Destino { get; set; } = string.Empty;
    public DateTime DataHoraInicio { get; set; }
    public DateTime DataHoraFim { get; set; }
    public int TotalDias { get; set; }
    public decimal ValorUnitarioBrl { get; set; }
    public decimal ValorTotalBrl { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
