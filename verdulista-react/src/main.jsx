import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Plus, Trash2, Download, ImageDown, Save, Send, ShoppingBasket, CalendarDays, FileText } from 'lucide-react'
import { WhatsappShareButton, WhatsappIcon } from 'react-share'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import './styles.css'

const emojiMap = {
  papa:'🥔', cebolla:'🧅', tomate:'🍅', zanahoria:'🥕', lechuga:'🥬',
  brocoli:'🥦', brócoli:'🥦', pepino:'🥒', aji:'🌶️', ají:'🌶️',
  choclo:'🌽', zapallo:'🎃', apio:'🥬', limon:'🍋', limón:'🍋',
  ajo:'🧄', palta:'🥑', berenjena:'🍆', pimiento:'🫑', culantro:'🌿',
  espinaca:'🥬', yuca:'🥔', camote:'🍠', betarraga:'🟣', beterraga:'🟣',
  col:'🥬', repollo:'🥬', vainita:'🫛', arveja:'🫛'
}

const baseSuggestions = ['papa','cebolla','tomate','zanahoria','lechuga','brócoli','pepino','ají','choclo','zapallo','apio','limón','culantro']

function normalizar(texto){
  return String(texto || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
}

function getEmoji(nombre){
  return emojiMap[String(nombre).toLowerCase().trim()] || emojiMap[normalizar(nombre)] || '🥗'
}

function money(n){
  return 'S/ ' + Number(n || 0).toFixed(2)
}

function createId(){
  if(typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'){
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function safeStorage(){
  try{
    const storage = window.localStorage
    storage.setItem('__verdulista_test__', '1')
    storage.removeItem('__verdulista_test__')
    return storage
  }catch{
    return null
  }
}

const storage = typeof window !== 'undefined' ? safeStorage() : null

function readStorage(key, fallback){
  if(!storage) return fallback
  try{
    return JSON.parse(storage.getItem(key) || JSON.stringify(fallback))
  }catch{
    return fallback
  }
}

function writeStorage(key, value){
  if(!storage) return false
  try{
    storage.setItem(key, JSON.stringify(value))
    return true
  }catch{
    return false
  }
}

function App(){
  const [verdura, setVerdura] = useState('')
  const [precio, setPrecio] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [reporte, setReporte] = useState('')
  const [items, setItems] = useState(() => readStorage('verdulista_items', []))
  const [historial, setHistorial] = useState(() => readStorage('verdulista_historial', []))
  const [sugerencias, setSugerencias] = useState(() => readStorage('verdulista_sugerencias', baseSuggestions))
  const [toast, setToast] = useState('')

  const fecha = new Date().toLocaleDateString('es-PE', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

  const resumen = useMemo(() => {
    const total = items.reduce((s, x) => s + x.subtotal, 0)
    const masCaro = items.length ? [...items].sort((a,b) => b.subtotal - a.subtotal)[0] : null
    const promedio = items.length ? total / items.length : 0
    return { total, masCaro, promedio }
  }, [items])

  const sugerenciasFiltradas = sugerencias
    .filter(x => normalizar(x).includes(normalizar(verdura)))
    .slice(0, 12)

  function notify(msg){
    setToast(msg)
    setTimeout(() => setToast(''), 2300)
  }

  function persistItems(next){
    setItems(next)
    writeStorage('verdulista_items', next)
  }

  function guardarSugerencia(nombre){
    const existe = sugerencias.some(x => normalizar(x) === normalizar(nombre))
    if(!existe){
      const next = [nombre.trim(), ...sugerencias]
      setSugerencias(next)
      writeStorage('verdulista_sugerencias', next)
    }
  }

  function agregar(){
    const p = parseFloat(precio)
    const c = parseFloat(cantidad) || 1
    if(!verdura.trim() || isNaN(p) || p <= 0 || isNaN(c) || c <= 0){
      notify('Coloca una verdura, precio y cantidad válidos.')
      return
    }

    guardarSugerencia(verdura)
    const nuevo = {
      id: createId(),
      verdura: verdura.trim(),
      emoji: getEmoji(verdura),
      precio: p,
      cantidad: c,
      subtotal: p * c
    }

    persistItems([...items, nuevo])
    setVerdura('')
    setPrecio('')
    setCantidad(1)
    notify('Producto agregado.')
  }

  function eliminar(id){
    persistItems(items.filter(x => x.id !== id))
  }

  function limpiar(){
    persistItems([])
    setReporte('')
    notify('Lista limpiada.')
  }

  function guardarLista(){
    if(items.length === 0){
      notify('No hay productos para guardar.')
      return
    }
    const nuevo = {
      id: createId(),
      fecha: new Date().toLocaleString('es-PE'),
      items,
      reporte,
      total: resumen.total
    }
    const next = [nuevo, ...historial]
    setHistorial(next)
    writeStorage('verdulista_historial', next)
    notify('Lista guardada en historial.')
  }

  function cargarHistorial(reg){
    persistItems(reg.items)
    setReporte(reg.reporte || '')
    notify('Lista cargada.')
  }

  function crearTextoWhatsApp(){
    return `🥬 *Verdulista Pro - Lista de compra*\n📅 ${new Date().toLocaleString('es-PE')}\n\n` +
      items.map(x => `${x.emoji} ${x.verdura} | Cant: ${x.cantidad} | ${money(x.precio)} | Subtotal: ${money(x.subtotal)}`).join('\n') +
      `\n\n💰 *Total:* ${money(resumen.total)}\n📝 *Reporte:* ${reporte || 'Sin observaciones.'}`
  }

  async function crearPDFBlob(){
    const reporteNode = document.getElementById('reporte-exportable')
    const canvas = await html2canvas(reporteNode, { backgroundColor:'#07120d', scale:2 })
    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth - 16
    const imgHeight = canvas.height * imgWidth / canvas.width

    pdf.setFillColor(7, 18, 13)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
    pdf.addImage(imgData, 'PNG', 8, 8, imgWidth, Math.min(imgHeight, pageHeight - 16))

    return pdf.output('blob')
  }

  async function descargarPDF(){
    if(items.length === 0){
      notify('No hay lista para exportar.')
      return
    }
    const blob = await crearPDFBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'verdulista-reporte.pdf'
    a.click()
    URL.revokeObjectURL(url)
    notify('PDF descargado.')
  }

  async function descargarImagen(){
    if(items.length === 0){
      notify('No hay reporte para exportar.')
      return
    }
    const node = document.getElementById('reporte-exportable')
    const canvas = await html2canvas(node, { backgroundColor:'#07120d', scale:2 })
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'verdulista-reporte.png'
    a.click()
    notify('Imagen descargada.')
  }

  async function compartirWhatsAppPDF(){
    if(items.length === 0){
      notify('No hay lista para compartir.')
      return
    }

    const texto = crearTextoWhatsApp()

    try{
      const blob = await crearPDFBlob()
      const file = new File([blob], 'verdulista-reporte.pdf', { type:'application/pdf' })

      if(navigator.canShare && navigator.canShare({ files:[file] })){
        await navigator.share({
          title:'Reporte de verduras',
          text:'Te comparto mi lista de verduras en PDF.',
          files:[file]
        })
        return
      }
    }catch(error){
      console.log(error)
    }

    window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank')
    notify('Tu navegador no adjuntó PDF directo. Se abrió WhatsApp con el texto; descarga el PDF y adjúntalo.')
  }

  return (
    <div className="app">
      {toast && <div className="toast">{toast}</div>}

      <header className="topbar">
        <div className="brand">
          <div className="brandIcon">🥬</div>
          <div>
            <h1>Verdulista Pro</h1>
            <p>React + Vite · PDF colorido · imagen · compartir por WhatsApp</p>
          </div>
        </div>
        <div className="date"><CalendarDays size={18}/>{fecha}</div>
      </header>

      <section className="layout">
        <aside className="panel">
          <div className="panelHead">
            <h2><ShoppingBasket size={21}/> Agregar verdura</h2>
            <span>Rápido</span>
          </div>

          <label>Verdura</label>
          <input value={verdura} onChange={e => setVerdura(e.target.value)} placeholder="Ej: papa, tomate, culantro..." />

          <div className="chips">
            {sugerenciasFiltradas.map(s => (
              <button key={s} className="chipBtn" onClick={() => setVerdura(s)}>{getEmoji(s)} {s}</button>
            ))}
          </div>

          <div className="formGrid">
            <div>
              <label>Precio S/</label>
              <input type="number" step="0.10" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="2.50"/>
            </div>
            <div>
              <label>Cantidad</label>
              <input type="number" step="1" value={cantidad} onChange={e => setCantidad(e.target.value)}/>
            </div>
          </div>

          <button className="primary" onClick={agregar}><Plus size={18}/> Agregar</button>

          <label>Reporte / descripción de lo que faltó</label>
          <textarea value={reporte} onChange={e => setReporte(e.target.value)} placeholder="Ej: faltó culantro, tomate caro, comprar más papa mañana..." />

          <div className="buttonGrid">
            <button onClick={guardarLista}><Save size={17}/> Guardar</button>
            <button onClick={descargarPDF}><FileText size={17}/> PDF</button>
            <button onClick={descargarImagen}><ImageDown size={17}/> Foto</button>
            {items.length > 0 && (
              <WhatsappShareButton 
                url={window.location.href} 
                title={crearTextoWhatsApp()}
                className="whatsapp"
                onClick={() => notify('Compartiendo por WhatsApp...')}
              >
                <Send size={17}/> WhatsApp
              </WhatsappShareButton>
            )}
          </div>

          <button className="danger" onClick={limpiar}><Trash2 size={17}/> Limpiar lista</button>

          <div className="history">
            <h2>Historial por fecha</h2>
            {historial.length === 0 ? <p className="muted">Aún no hay listas guardadas.</p> :
              historial.slice(0, 7).map(reg => (
                <div className="historyItem" key={reg.id}>
                  <div>
                    <b>{reg.fecha}</b>
                    <small>{reg.items.length} productos · {money(reg.total)}</small>
                  </div>
                  <button onClick={() => cargarHistorial(reg)}>Ver</button>
                </div>
              ))}
          </div>
        </aside>

        <main className="main">
          <section className="panel">
            <div className="panelHead">
              <h2>Tabla de compra</h2>
              <span>{items.length} productos</span>
            </div>

            {items.length === 0 ? <div className="empty">Agrega verduras para ver la tabla.</div> :
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Emoji</th><th>Verdura</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td><span className="emojiCell">{item.emoji}</span></td>
                        <td><b>{item.verdura}</b></td>
                        <td>{item.cantidad}</td>
                        <td>{money(item.precio)}</td>
                        <td><b>{money(item.subtotal)}</b></td>
                        <td><button className="miniDanger" onClick={() => eliminar(item.id)}>X</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }

            <div className="stats">
              <div><span>Total</span><b>{money(resumen.total)}</b></div>
              <div><span>Productos</span><b>{items.length}</b></div>
              <div><span>Más caro</span><b>{resumen.masCaro ? `${resumen.masCaro.emoji} ${resumen.masCaro.verdura}` : '-'}</b></div>
              <div><span>Promedio</span><b>{money(resumen.promedio)}</b></div>
            </div>
          </section>

          <section className="reportPreview">
            <ReporteExportable items={items} resumen={resumen} reporte={reporte}/>
          </section>
        </main>
      </section>
    </div>
  )
}

function ReporteExportable({items, resumen, reporte}){
  const fecha = new Date().toLocaleString('es-PE')
  return (
    <div className="exportCard" id="reporte-exportable">
      <div className="exportHero">
        <div>
          <span className="exportLabel">REPORTE DE COMPRA</span>
          <h2>🥬 Verdulista Pro</h2>
          <p>{fecha}</p>
        </div>
        <div className="exportTotal">
          <small>Total</small>
          <b>{money(resumen.total)}</b>
        </div>
      </div>

      <div className="exportStats">
        <div><span>Productos</span><b>{items.length}</b></div>
        <div><span>Más costoso</span><b>{resumen.masCaro ? `${resumen.masCaro.emoji} ${resumen.masCaro.verdura}` : '-'}</b></div>
        <div><span>Promedio</span><b>{money(resumen.promedio)}</b></div>
      </div>

      {items.length === 0 ? (
        <div className="empty exportEmpty">Aquí aparecerá el reporte final.</div>
      ) : (
        <>
          <div className="exportGrid">
            {items.map(item => (
              <div className="exportItem" key={item.id}>
                <div className="bigEmoji">{item.emoji}</div>
                <div>
                  <b>{item.verdura}</b>
                  <small>{item.cantidad} und. · {money(item.subtotal)}</small>
                </div>
                <div className="progress">
                  <i style={{width: `${Math.max(8, (item.subtotal / resumen.total) * 100)}%`}}></i>
                </div>
              </div>
            ))}
          </div>

          <table className="exportTable">
            <thead>
              <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id + 'r'}>
                  <td>{item.emoji} {item.verdura}</td>
                  <td>{item.cantidad}</td>
                  <td>{money(item.precio)}</td>
                  <td>{money(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="exportNote">
            <b>📝 Observaciones:</b>
            <p>{reporte || 'Sin observaciones registradas.'}</p>
          </div>
        </>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
