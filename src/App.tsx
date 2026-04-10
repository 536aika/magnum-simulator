import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Container,
  CssBaseline,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  createTheme,
} from '@mui/material'
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import KeyboardArrowUpRounded from '@mui/icons-material/KeyboardArrowUpRounded'

type Business = 'host' | 'cabaret' | 'concafe' | 'other'
type SizeKey = '3L' | '6L' | '15L'

type RowState = {
  count: string
  price: string
}

const GRADIENT = 'linear-gradient(135deg, #A855F7, #7C3AED, #06B6D4, #34D399)'

const PLACEHOLDER_YEN: Record<Business, Record<SizeKey, string>> = {
  host: {
    '3L': '¥132,300',
    '6L': '¥357,700',
    '15L': '¥1,099,000',
  },
  cabaret: {
    '3L': '¥94,500',
    '6L': '¥255,500',
    '15L': '¥785,000',
  },
  concafe: {
    '3L': '¥56,700',
    '6L': '¥153,300',
    '15L': '¥471,000',
  },
  other: {
    '3L': '¥56,700',
    '6L': '¥153,300',
    '15L': '¥471,000',
  },
}

const BUSINESS_LABEL: Record<Business, string> = {
  host: 'ホスト',
  cabaret: 'キャバクラ',
  concafe: 'コンカフェ・BAR',
  other: 'その他',
}

function toIntFromInput(value: string): number {
  const digits = value.replace(/[^\d]/g, '')
  if (!digits) return 0
  const n = Number.parseInt(digits, 10)
  return Number.isFinite(n) ? n : 0
}

function formatYen(value: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value)
}

/** 「LINEに戻る」を押さず入力だけした場合の自動送信までの無操作時間 */
const AUTO_LOG_IDLE_MS = 45_000

type LogPostBody = {
  at: string
  business: Business
  businessLabel: string
  '3L_count': number
  '3L_price': number
  '3L_sales': number
  '6L_count': number
  '6L_price': number
  '6L_sales': number
  '15L_count': number
  '15L_price': number
  '15L_sales': number
  totalSales: number
  userAgent: string
}

function buildLogPostBody(business: Business, rows: Record<SizeKey, RowState>): LogPostBody {
  const c3 = toIntFromInput(rows['3L'].count)
  const p3 = toIntFromInput(rows['3L'].price)
  const s3 = c3 * p3
  const c6 = toIntFromInput(rows['6L'].count)
  const p6 = toIntFromInput(rows['6L'].price)
  const s6 = c6 * p6
  const c15 = toIntFromInput(rows['15L'].count)
  const p15 = toIntFromInput(rows['15L'].price)
  const s15 = c15 * p15
  return {
    at: new Date().toISOString(),
    business,
    businessLabel: BUSINESS_LABEL[business],
    '3L_count': c3,
    '3L_price': p3,
    '3L_sales': s3,
    '6L_count': c6,
    '6L_price': p6,
    '6L_sales': s6,
    '15L_count': c15,
    '15L_price': p15,
    '15L_sales': s15,
    totalSales: s3 + s6 + s15,
    userAgent: navigator.userAgent,
  }
}

async function postLogToEndpoint(body: LogPostBody): Promise<void> {
  const endpoint = import.meta.env.VITE_LOG_ENDPOINT
  if (typeof endpoint !== 'string' || !endpoint.trim()) return
  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    })
  } catch {
    // 送信失敗は握りつぶす（戻る遷移や入力は継続）
  }
}

type SizeCardProps = {
  size: SizeKey
  sale: number
  placeholder: string
  count: string
  price: string
  onPriceChange: (value: string) => void
  onCountChange: (value: string) => void
  onNudgeCount: (delta: number) => void
}

function SizeCard({
  size,
  sale,
  placeholder,
  count,
  price,
  onPriceChange,
  onCountChange,
  onNudgeCount,
}: SizeCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        position: 'relative',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 8,
          background: GRADIENT,
        },
      }}
    >
      <CardContent sx={{ pl: 2.5, pr: 2.25, py: 2.25 }}>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {size}
            </Typography>
            <Stack spacing={0.25} sx={{ alignItems: 'flex-end' }}>
              <Typography variant="caption" color="text.secondary">
                売上
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.2 }}>
                {formatYen(sale)}
              </Typography>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1.25}>
            <TextField
              label="1本あたり販売価格（円）"
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              slotProps={{
                htmlInput: {
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                },
              }}
              placeholder={placeholder}
            />
            <TextField
              label="販売本数"
              value={count}
              onChange={(e) => onCountChange(e.target.value)}
              slotProps={{
                htmlInput: {
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Stack spacing={0.25} sx={{ mr: -0.5 }}>
                        <IconButton
                          aria-label="本数を増やす"
                          size="small"
                          onClick={() => onNudgeCount(+1)}
                          sx={{ width: 36, height: 22, borderRadius: 1 }}
                        >
                          <KeyboardArrowUpRounded fontSize="small" />
                        </IconButton>
                        <IconButton
                          aria-label="本数を減らす"
                          size="small"
                          onClick={() => onNudgeCount(-1)}
                          sx={{ width: 36, height: 22, borderRadius: 1 }}
                        >
                          <KeyboardArrowDownRounded fontSize="small" />
                        </IconButton>
                      </Stack>
                    </InputAdornment>
                  ),
                },
              }}
              placeholder="例: 10"
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default function App() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [rows, setRows] = useState<Record<SizeKey, RowState>>({
    '3L': { count: '', price: '' },
    '6L': { count: '', price: '' },
    '15L': { count: '', price: '' },
  })

  const logStateRef = useRef({ business: null as Business | null, rows })
  logStateRef.current = { business, rows }

  useEffect(() => {
    if (business === null) return
    const total =
      toIntFromInput(rows['3L'].count) * toIntFromInput(rows['3L'].price) +
      toIntFromInput(rows['6L'].count) * toIntFromInput(rows['6L'].price) +
      toIntFromInput(rows['15L'].count) * toIntFromInput(rows['15L'].price)
    if (total <= 0) return
    const t = window.setTimeout(() => {
      const { business: b, rows: r } = logStateRef.current
      if (b === null) return
      const idleTotal =
        toIntFromInput(r['3L'].count) * toIntFromInput(r['3L'].price) +
        toIntFromInput(r['6L'].count) * toIntFromInput(r['6L'].price) +
        toIntFromInput(r['15L'].count) * toIntFromInput(r['15L'].price)
      if (idleTotal <= 0) return
      void postLogToEndpoint(buildLogPostBody(b, r))
    }, AUTO_LOG_IDLE_MS)
    return () => window.clearTimeout(t)
  }, [rows, business])

  const backUrl =
    typeof import.meta.env.VITE_BACK_URL === 'string' && import.meta.env.VITE_BACK_URL.trim()
      ? import.meta.env.VITE_BACK_URL
      : 'https://lin.ee/RW2k4Uv'

  useEffect(() => {
    const raw = import.meta.env.VITE_LIFF_ID
    if (typeof raw !== 'string' || !raw.trim()) return
    const w = window as unknown as { liff?: { init: (args: { liffId: string }) => Promise<void> } }
    if (!w.liff?.init) return
    w.liff
      .init({ liffId: import.meta.env.VITE_LIFF_ID })
      .catch(() => {
        // フォールバック: LIFF初期化に失敗しても通常ブラウザとして動作させる
      })
  }, [])

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'light',
          background: { default: '#FFFFFF' },
          primary: { main: '#7C3AED' },
          secondary: { main: '#06B6D4' },
          text: { primary: '#0F172A', secondary: '#475569' },
          divider: 'rgba(15, 23, 42, 0.10)',
        },
        shape: { borderRadius: 16 },
        typography: {
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", Meiryo, sans-serif',
        },
        components: {
          MuiButtonBase: {
            styleOverrides: {
              root: {
                minHeight: 44,
              },
            },
          },
          MuiTextField: {
            defaultProps: {
              fullWidth: true,
              size: 'medium',
            },
          },
        },
      }),
    [],
  )

  const perSizeSales: Record<SizeKey, number> = useMemo(() => {
    return (['3L', '6L', '15L'] as const).reduce(
      (acc, size) => {
        const count = toIntFromInput(rows[size].count)
        const price = toIntFromInput(rows[size].price)
        acc[size] = count * price
        return acc
      },
      { '3L': 0, '6L': 0, '15L': 0 } as Record<SizeKey, number>,
    )
  }, [rows])

  const totalSales = perSizeSales['3L'] + perSizeSales['6L'] + perSizeSales['15L']

  const handleChange = (size: SizeKey, key: keyof RowState, raw: string) => {
    // 入力体験を優先して、保存値は生文字列のまま保持（計算時に数値化）
    const next = raw
    setRows((prev) => ({
      ...prev,
      [size]: {
        ...prev[size],
        [key]: next,
      },
    }))
  }

  const nudgeCount = (size: SizeKey, delta: number) => {
    setRows((prev) => {
      const current = toIntFromInput(prev[size].count)
      const next = Math.max(0, current + delta)
      return {
        ...prev,
        [size]: { ...prev[size], count: next ? String(next) : '' },
      }
    })
  }

  const handleReset = () => {
    setRows({
      '3L': { count: '', price: '' },
      '6L': { count: '', price: '' },
      '15L': { count: '', price: '' },
    })
  }

  const handleBackToLine = async () => {
    if (business !== null) {
      await postLogToEndpoint(buildLogPostBody(business, rows))
    }
    const w = window as unknown as { liff?: { isInClient?: () => boolean; closeWindow?: () => void } }
    if (w.liff?.isInClient?.() && w.liff?.closeWindow) {
      w.liff.closeWindow()
      return
    }
    window.location.href = backUrl
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
        {/* Header */}
        <Box
          sx={{
            background: GRADIENT,
            color: '#fff',
            py: 2.25,
          }}
        >
          <Container maxWidth={false} sx={{ maxWidth: 430 }}>
            <Stack spacing={0.75}>
              <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.3 }}>
                売上シミュレーター
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.95 }}>
                3サイズの本数と価格を入れるだけで、売上と合計がリアルタイムで分かります。
              </Typography>
            </Stack>
          </Container>
        </Box>

        <Container
          maxWidth={false}
          sx={{
            maxWidth: 430,
            pt: 2,
            pb: 12,
          }}
        >
          {/* Business selector */}
          <Stack spacing={1.25}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              業態
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={business}
              onChange={(_, v: Business | null) => {
                if (v != null) setBusiness(v)
              }}
              sx={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1,
                '& .MuiToggleButton-root': {
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: 'divider',
                  px: 1.25,
                  py: 1.1,
                  fontWeight: 800,
                  letterSpacing: -0.2,
                  bgcolor: '#fff',
                },
                '& .MuiToggleButton-root.Mui-selected': {
                  color: '#fff',
                  borderColor: 'transparent',
                  background: GRADIENT,
                },
                '& .MuiToggleButton-root.Mui-selected:hover': {
                  background: GRADIENT,
                },
              }}
            >
              <ToggleButton value="host">{BUSINESS_LABEL.host}</ToggleButton>
              <ToggleButton value="cabaret">{BUSINESS_LABEL.cabaret}</ToggleButton>
              <ToggleButton value="concafe">{BUSINESS_LABEL.concafe}</ToggleButton>
              <ToggleButton value="other">{BUSINESS_LABEL.other}</ToggleButton>
            </ToggleButtonGroup>

            <Typography variant="caption" color="text.secondary" sx={{ pl: 0.25 }}>
              ※表示の販売価格は目安です
            </Typography>

            <Divider />
          </Stack>

          {business === null ? (
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'divider',
                bgcolor: 'rgba(15, 23, 42, 0.02)',
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                まず業態を選ぶと、3L / 6L / 15L の入力が表示されます。
              </Typography>
            </Box>
          ) : null}

          <Collapse in={business !== null} timeout="auto" unmountOnExit>
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              {business !== null &&
                (['3L', '6L', '15L'] as const).map((sz) => (
                  <SizeCard
                    key={sz}
                    size={sz}
                    sale={perSizeSales[sz]}
                    placeholder={PLACEHOLDER_YEN[business][sz]}
                    count={rows[sz].count}
                    price={rows[sz].price}
                    onPriceChange={(v) => handleChange(sz, 'price', v)}
                    onCountChange={(v) => handleChange(sz, 'count', v)}
                    onNudgeCount={(d) => nudgeCount(sz, d)}
                  />
                ))}

              <Button
                variant="outlined"
                onClick={handleReset}
                sx={{
                  borderRadius: 999,
                  fontWeight: 800,
                  minHeight: 48,
                }}
              >
                リセット
              </Button>

              <Button
                variant="contained"
                onClick={handleBackToLine}
                sx={{
                  borderRadius: 999,
                  fontWeight: 900,
                  minHeight: 48,
                  background: GRADIENT,
                }}
              >
                LINEに戻る
              </Button>
            </Stack>
          </Collapse>
        </Container>

        {/* Sticky total */}
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
            pb: 1.25,
            pt: 1.25,
            bgcolor: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Container maxWidth={false} sx={{ maxWidth: 430 }}>
            <Card
              elevation={0}
              sx={{
                overflow: 'hidden',
                borderRadius: 18,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ background: GRADIENT, color: '#fff', px: 2, py: 1.5 }}>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                    合計売上
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 950, letterSpacing: -0.2 }}>
                    {formatYen(totalSales)}
                  </Typography>
                </Stack>
              </Box>
            </Card>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  )
}
