using System.Security.Cryptography;

namespace Api.Common;

// .NET 8 has no Guid.CreateVersion7() (that lands in .NET 9 / Npgsql on PG18).
// Minimal RFC 9562 UUIDv7: 48-bit Unix milliseconds + random tail, version and
// variant bits set. Big-endian construction keeps the Guid string form and the
// Postgres `uuid` byte order (Npgsql writes Guids big-endian) time-sortable.
public static class GuidV7
{
    public static Guid NewGuid()
    {
        Span<byte> bytes = stackalloc byte[16];
        RandomNumberGenerator.Fill(bytes);

        var unixMs = (ulong)DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        bytes[0] = (byte)(unixMs >> 40);
        bytes[1] = (byte)(unixMs >> 32);
        bytes[2] = (byte)(unixMs >> 24);
        bytes[3] = (byte)(unixMs >> 16);
        bytes[4] = (byte)(unixMs >> 8);
        bytes[5] = (byte)unixMs;

        bytes[6] = (byte)((bytes[6] & 0x0F) | 0x70); // version 7
        bytes[8] = (byte)((bytes[8] & 0x3F) | 0x80); // RFC 4122 variant

        return new Guid(bytes, bigEndian: true);
    }
}
