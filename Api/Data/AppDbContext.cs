using Api.Features.Auth;
using Api.Features.Chat;
using Api.Features.Escrows;
using Api.Features.Jobs;
using Api.Features.Notifications;
using Api.Features.Ratings;
using Api.Features.Wallet;
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

    public DbSet<Conversation> Conversations => Set<Conversation>();           // task 04
    public DbSet<Message> Messages => Set<Message>();                          // task 04

    public DbSet<JobApplication> JobApplications => Set<JobApplication>();     // task 06
    public DbSet<Wallet> Wallets => Set<Wallet>();                             // task 06
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>(); // task 06
    public DbSet<Escrow> Escrows => Set<Escrow>();                             // task 06

    public DbSet<Notification> Notifications => Set<Notification>();           // task 05

    public DbSet<Review> Reviews => Set<Review>();                             // task 07

    // TODO task 08+: add remaining DbSets as features land.

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
            entity.HasIndex(j => j.Hidden);             // task 12a: public list excludes hidden jobs
        });

        modelBuilder.Entity<JobImage>(entity =>
        {
            // The same upload cannot repeat on one job.
            entity.HasKey(i => new { i.JobId, i.Url });
        });

        modelBuilder.Entity<Conversation>(entity =>
        {
            // One conversation per job — the unique index backs the idempotent POST.
            entity.HasIndex(c => c.JobId).IsUnique();

            entity.HasOne(c => c.Job)
                .WithOne()
                .HasForeignKey<Conversation>(c => c.JobId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.Property(m => m.Body).HasMaxLength(2000);

            // History pages newest-first by (CreatedAt, Id).
            entity.HasIndex(m => new { m.ConversationId, m.CreatedAt }).IsDescending(false, true);

            entity.HasOne(m => m.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(m => m.SenderId);
        });

        modelBuilder.Entity<Wallet>(entity =>
        {
            entity.HasKey(w => w.UserId);
            entity.Property(w => w.Balance).HasPrecision(18, 0);
            entity.ToTable(t => t.HasCheckConstraint("CK_Wallets_Balance_NonNegative", "\"Balance\" >= 0"));

            // Task 06: this pair is what Npgsql maps to the system `xmin` column
            // (xid store type, concurrency token) — same model shape as Jobs.Version.
            entity.Property(w => w.Version).IsConcurrencyToken().ValueGeneratedOnAddOrUpdate();

            entity.HasOne(w => w.User)
                .WithOne()
                .HasForeignKey<Wallet>(w => w.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WalletTransaction>(entity =>
        {
            entity.Property(t => t.Type).HasConversion<string>();
            entity.Property(t => t.Amount).HasPrecision(18, 0);

            // Ledger history pages newest-first by (CreatedAt, Id).
            entity.HasIndex(t => new { t.UserId, t.CreatedAt }).IsDescending(false, true);

            entity.HasOne(t => t.User)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Escrow>(entity =>
        {
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.Amount).HasPrecision(18, 0);

            // One escrow per job; re-accept reuses the row after a refund.
            entity.HasIndex(e => e.JobId).IsUnique();
            entity.HasIndex(e => new { e.PayerId, e.PayeeId });

            entity.HasOne(e => e.Job)
                .WithOne()
                .HasForeignKey<Escrow>(e => e.JobId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Payer)
                .WithMany()
                .HasForeignKey(e => e.PayerId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Payee)
                .WithMany()
                .HasForeignKey(e => e.PayeeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<JobApplication>(entity =>
        {
            entity.HasKey(a => new { a.JobId, a.WorkerId });
            entity.Property(a => a.Offer).HasPrecision(18, 0);

            entity.HasOne(a => a.Job)
                .WithMany()
                .HasForeignKey(a => a.JobId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(a => a.Worker)
                .WithMany()
                .HasForeignKey(a => a.WorkerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(a => a.WorkerId);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.Property(n => n.Type).HasMaxLength(32);
            entity.Property(n => n.Title).HasMaxLength(200);
            entity.Property(n => n.Body).HasMaxLength(500);

            // Newest-first pages per user: (UserId, Read, CreatedAt desc).
            entity.HasIndex(n => new { n.UserId, n.Read, n.CreatedAt }).IsDescending(false, false, true);

            entity.HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<Job>()
                .WithMany()
                .HasForeignKey(n => n.JobId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.Property(r => r.Comment).HasMaxLength(1000);
            entity.ToTable(t => t.HasCheckConstraint("CK_Reviews_Rate_Range", "\"Rate\" BETWEEN 1 AND 5"));

            // One review per reviewer per job — the unique index backs the double-rate 409.
            entity.HasIndex(r => new { r.JobId, r.ReviewerId }).IsUnique();
            // Received-rating history pages newest-first by (ReviewerId, CreatedAt desc).
            entity.HasIndex(r => new { r.ReviewerId, r.CreatedAt }).IsDescending(false, true);

            entity.HasOne(r => r.Job)
                .WithMany()
                .HasForeignKey(r => r.JobId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(r => r.Reviewer)
                .WithMany()
                .HasForeignKey(r => r.ReviewerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
