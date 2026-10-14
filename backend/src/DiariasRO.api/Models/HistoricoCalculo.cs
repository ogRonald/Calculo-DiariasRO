namespace DiariasRO.api.Models;

public class HistoricoCalculo
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    // --- Campos do Viajante ---
    public string NomeBeneficiario { get; set; } = string.Empty;
    public string MatriculaBeneficiario { get; set; } = string.Empty;
    public string OrgaoBeneficiario { get; set; } = string.Empty;

    // --- Dados da Viagem ---
    public string Destino { get; set; } = string.Empty;
    public DateTime DataHoraInicio { get; set; }
    public DateTime DataHoraFim { get; set; }
    public int TotalDias { get; set; }
    public decimal ValorUnitarioBrl { get; set; }
    public decimal ValorTotalBrl { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    // ==========================================
    //  WORKFLOW DE APROVAÇÃO
    // ==========================================
    public StatusDiaria Status { get; set; } = StatusDiaria.Pendente; 
    public Guid? GestorAprovadorId { get; set; } // Quem aprovou ou rejeitou
    public DateTime? DataAprovacao { get; set; } 
    public string? MotivoDevolucao { get; set; } // Justificativa caso seja devolvido
}