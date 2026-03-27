import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const alt = 'SSFI - Speed Skating Federation of India';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  const logoData = await readFile(join(process.cwd(), 'public', 'images', 'logo', 'favicon.webp'));
  const logoBase64 = `data:image/webp;base64,${logoData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#0a1628',
          padding: '40px',
        }}
      >
        <img
          src={logoBase64}
          width={300}
          height={300}
          style={{ objectFit: 'contain' }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '30px',
          }}
        >
          <div
            style={{
              fontSize: '42px',
              fontWeight: 'bold',
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            Speed Skating Federation of India
          </div>
          <div
            style={{
              fontSize: '22px',
              color: '#94a3b8',
              marginTop: '12px',
              textAlign: 'center',
            }}
          >
            Official Governing Body | Since 2001
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
