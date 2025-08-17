import express from express
import axios from axios

const app = express()
app.use(express.json())

const BITCOIN_RPC_URL = process.env.BITCOIN_RPC_URL || http://user:pass@localhost:18443
const LND_REST_URL = process.env.LND_REST_URL || http://localhost:8080
const AI_URL = process.env.AI_URL || http://localhost:8090

app.get(/health, async (req, res) => {
  try {
    const [ai, ln] = await Promise.allSettled([
      axios.get(`${AI_URL}/health`, { timeout: 1500 }),
      axios.get(`${LND_REST_URL}/v1/getinfo`, { timeout: 1500 }),
    ])
    res.json({ ok: true, ai: ai.status === fulfilled, ln: ln.status === fulfilled })
  } catch (e) {
    res.json({ ok: false })
  }
})

// Generic bitcoind JSON-RPC proxy
app.post(/rpc, async (req, res) => {
  try {
    const { method, params = [] } = req.body || {}
    const r = await axios.post(BITCOIN_RPC_URL, {
      jsonrpc: 1.0, id: brixa, method, params,
    })
    res.json(r.data)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

// AI proxy
app.get(/ai/fee, async (req, res) => {
  try {
    const r = await axios.get(`${AI_URL}/ai/fee`, { params: { target_blocks: req.query.target_blocks || 3 } })
    res.json(r.data)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})
app.get(/ai/route, async (req, res) => {
  try {
    const r = await axios.get(`${AI_URL}/ai/route`, { params: { dest_pubkey: req.query.dest_pubkey ||  } })
    res.json(r.data)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

// LND basic info (requires proper macaroon/tls in real deployments)
app.get(/ln/getinfo, async (req, res) => {
  try {
    const r = await axios.get(`${LND_REST_URL}/v1/getinfo`)
    res.json(r.data)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

const port = process.env.PORT || 8088
app.listen(port, () => {
  console.log(`Brixa bridge listening on :${port}`)
})
