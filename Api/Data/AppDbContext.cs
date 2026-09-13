using Microsoft.EntityFrameworkCore;

namespace Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // TODO task 01-06: add DbSets as features land (keep one vertical slice per task).
    // public DbSet<User> Users => Set<User>();                                  // task 01
    // public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();          // task 01
    // public DbSet<Job> Jobs => Set<Job>();                                      // task 02
    // public DbSet<JobImage> JobImages => Set<JobImage>();                       // task 02
    // public DbSet<JobApplication> JobApplications => Set<JobApplication>();     // task 02/06
    // public DbSet<Conversation> Conversations => Set<Conversation>();           // task 04
    // public DbSet<Message> Messages => Set<Message>();                          // task 04
    // public DbSet<Notification> Notifications => Set<Notification>();           // task 05
    // public DbSet<Wallet> Wallets => Set<Wallet>();                             // task 06
    // public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>(); // task 06
    // public DbSet<Escrow> Escrows => Set<Escrow>();                             // task 06
    // public DbSet<Review> Reviews => Set<Review>();                             // task 07
    // public DbSet<Category> Categories => Set<Category>();                      // task 02 seed

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Neon Postgres only (UseNpgsql). No SQL Server / RowVersion.
        // xmin concurrency from day 1 (task 01-06): map `uint Version` on mutable
        // aggregates via `entity.Property(x => x.Version).IsRowVersion()` which
        // Npgsql maps to the system `xmin` column, e.g.
        //   modelBuilder.Entity<Job>().Property(j => j.Version).IsRowVersion();
        //   modelBuilder.Entity<Wallet>().Property(w => w.Version).IsRowVersion();
        // TODO task 01-06: entity configurations + indexes land with their features.
    }
}
