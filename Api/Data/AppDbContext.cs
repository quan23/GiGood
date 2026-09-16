using Api.Features.Auth;
using Api.Features.Jobs;
using Microsoft.EntityFrameworkCore;

namespace Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // One vertical slice per task.
    public DbSet<User> Users => Set<User>();                                  // task 01
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();          // task 01

    public DbSet<Category> Categories => Set<Category>();                      // task 02 seed
    public DbSet<Job> Jobs => Set<Job>();                                      // task 02
    public DbSet<JobImage> JobImages => Set<JobImage>();                       // task 02

    // TODO task 04-07: add remaining DbSets as features land.
    // public DbSet<JobApplication> JobApplications => Set<JobApplication>();     // task 02/06
    // public DbSet<Conversation> Conversations => Set<Conversation>();           // task 04
    // public DbSet<Message> Messages => Set<Message>();                          // task 04
    // public DbSet<Notification> Notifications => Set<Notification>();           // task 05
    // public DbSet<Wallet> Wallets => Set<Wallet>();                             // task 06
    // public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>(); // task 06
    // public DbSet<Escrow> Escrows => Set<Escrow>();                             // task 06
    // public DbSet<Review> Reviews => Set<Review>();                             // task 07

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Neon Postgres only (UseNpgsql). No SQL Server / RowVersion.
        // xmin concurrency from day 1 (task 01-06): map `uint Version` on mutable
        // aggregates via `entity.Property(x => x.Version).IsRowVersion()` which
        // Npgsql maps to the system `xmin` column, e.g.
        //   modelBuilder.Entity<Job>().Property(j => j.Version).IsRowVersion();
        //   modelBuilder.Entity<Wallet>().Property(w => w.Version).IsRowVersion();
        // TODO task 04-07: remaining entity configurations + indexes land with their features.

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Phone).IsUnique();
            entity.Property(u => u.Skills).HasColumnType("jsonb");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(t => t.TokenHash).IsUnique();
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Job>(entity =>
        {
            entity.Property(j => j.Status).HasConversion<string>();
            entity.Property(j => j.Version).IsRowVersion(); // Npgsql maps uint to the xmin system column

            entity.HasOne(j => j.Owner)
                .WithMany()
                .HasForeignKey(j => j.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(j => j.Images)
                .WithOne()
                .HasForeignKey(i => i.JobId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(j => j.OwnerId);
            entity.HasIndex(j => j.Status);
            entity.HasIndex(j => j.Category);
            entity.HasIndex(j => j.CreatedAt);
            entity.HasIndex(j => new { j.Lat, j.Lng }); // bbox prefilter (task 03)
        });

        modelBuilder.Entity<JobImage>(entity =>
        {
            // The same upload cannot repeat on one job.
            entity.HasKey(i => new { i.JobId, i.Url });
        });
    }
}
