using DiariasRO.api.Models;
using Microsoft.EntityFrameworkCore;

namespace DiariasRO.api.Data;

public class DiariasDbContext : DbContext
{
    public DiariasDbContext(DbContextOptions<DiariasDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<HistoricoCalculo> Historicos => Set<HistoricoCalculo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Matricula).IsUnique();
            entity.Property(u => u.Matricula).IsRequired().HasMaxLength(50);
            entity.Property(u => u.SenhaHash).IsRequired();
            entity.Property(u => u.Orgao).IsRequired().HasMaxLength(200);
            entity.Property(u => u.NomeCompleto).HasMaxLength(200);
            entity.Property(u => u.Funcao).HasMaxLength(150);
            entity.Property(u => u.Email).HasMaxLength(200);
            entity.Property(u => u.Celular).HasMaxLength(30);
        });

        modelBuilder.Entity<HistoricoCalculo>(entity =>
        {
            entity.HasKey(h => h.Id);
            entity.Property(h => h.Destino).IsRequired().HasMaxLength(200);
            entity.HasOne(h => h.Usuario)
                .WithMany(u => u.Historicos)
                .HasForeignKey(h => h.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
