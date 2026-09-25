namespace DiariasRO.api.Dtos;

public class SalvarHistoricoDto
{
    public Guid UsuarioId { get; set; }
    public string NomeBeneficiario { get; set; } = string.Empty;
    public string MatriculaBeneficiario { get; set; } = string.Empty;
    public string OrgaoBeneficiario { get; set; } = string.Empty;
    public string Destino { get; set; } = string.Empty;
    public DateTime DataHoraInicio { get; set; }
    public DateTime DataHoraFim { get; set; }
    public int TotalDias { get; set; }
    public decimal ValorUnitarioBrl { get; set; }
    public decimal ValorTotalBrl { get; set; }
}