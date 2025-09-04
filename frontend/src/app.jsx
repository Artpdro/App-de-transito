import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Upload, MapPin, Route, BarChart3, AlertTriangle } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import './App.css'

// Fix para ícones do Leaflet
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.divIcon({
  html: '<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
  iconSize: [12, 12],
  className: 'custom-div-icon'
})

L.Marker.prototype.options.icon = DefaultIcon

const API_BASE = 'http://localhost:8000'

function App() {
  const [stats, setStats] = useState(null)
  const [route, setRoute] = useState(null)
  const [nearbyAccidents, setNearbyAccidents] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  
  // Estados para formulário de rota
  const [origemLat, setOrigemLat] = useState(-8.05)
  const [origemLon, setOrigemLon] = useState(-34.9)
  const [destinoLat, setDestinoLat] = useState(-8.1)
  const [destinoLon, setDestinoLon] = useState(-34.95)

  // Carregar estatísticas ao iniciar
  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/stats/`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setLoading(true)
    setUploadStatus('Enviando arquivo...')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE}/upload_csv/`, {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      setUploadStatus(result.message)
      fetchStats() // Recarregar estatísticas
    } catch (error) {
      setUploadStatus('Erro ao enviar arquivo: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const calculateRoute = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `${API_BASE}/route/?origem_lat=${origemLat}&origem_lon=${origemLon}&destino_lat=${destinoLat}&destino_lon=${destinoLon}`
      )
      const data = await response.json()
      setRoute(data)

      // Buscar acidentes próximos à rota
      const accidentsResponse = await fetch(
        `${API_BASE}/accidents_nearby/?lat=${origemLat}&lon=${origemLon}&radius_km=10`
      )
      const accidentsData = await accidentsResponse.json()
      setNearbyAccidents(accidentsData.acidentes || [])
    } catch (error) {
      console.error('Erro ao calcular rota:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Baixo': return 'bg-green-500'
      case 'Médio': return 'bg-yellow-500'
      case 'Alto': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Safe Routes</h1>
          <p className="text-gray-600">Análise e otimização de rotas seguras baseada em dados de acidentes</p>
        </header>

        <Tabs defaultValue="map" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Mapa
            </TabsTrigger>
            <TabsTrigger value="route" className="flex items-center gap-2">
              <Route className="w-4 h-4" />
              Calcular Rota
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Estatísticas
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload CSV
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Mapa Interativo</CardTitle>
                    <CardDescription>
                      Visualização de acidentes e rotas calculadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 rounded-lg overflow-hidden">
                      <MapContainer
                        center={[-8.05, -34.9]}
                        zoom={10}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        
                        {/* Marcadores de acidentes */}
                        {nearbyAccidents.map((accident) => (
                          <Marker
                            key={accident.id}
                            position={[accident.latitude, accident.longitude]}
                          >
                            <Popup>
                              <div className="p-2">
                                <h3 className="font-semibold">{accident.municipio}</h3>
                                <p className="text-sm">{accident.tipo_acidente}</p>
                                <p className="text-xs text-gray-600">
                                  Mortos: {accident.mortos} | Feridos Graves: {accident.feridos_graves}
                                </p>
                              </div>
                            </Popup>
                          </Marker>
                        ))}

                        {/* Linha da rota */}
                        {route && (
                          <Polyline
                            positions={route.rota.map(point => [point.lat, point.lng])}
                            color="blue"
                            weight={4}
                            opacity={0.7}
                          />
                        )}
                      </MapContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {route && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Route className="w-5 h-5" />
                        Informações da Rota
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Distância</Label>
                        <p className="text-lg font-semibold">{route.distancia_km} km</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Nível de Risco</Label>
                        <Badge className={`${getRiskColor(route.nivel_risco)} text-white`}>
                          {route.nivel_risco}
                        </Badge>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Score de Risco</Label>
                        <p className="text-lg font-semibold">{route.risco_total}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <Label>Risco Origem</Label>
                          <p className="font-medium">{route.risco_origem}</p>
                        </div>
                        <div>
                          <Label>Risco Destino</Label>
                          <p className="font-medium">{route.risco_destino}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Acidentes Próximos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-2">
                      {nearbyAccidents.length} acidentes encontrados
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {nearbyAccidents.slice(0, 5).map((accident) => (
                        <div key={accident.id} className="p-2 bg-gray-50 rounded text-sm">
                          <p className="font-medium">{accident.municipio}</p>
                          <p className="text-gray-600">{accident.tipo_acidente}</p>
                          <p className="text-xs">Distância: {accident.distancia_km} km</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="route" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Calcular Rota Segura</CardTitle>
                <CardDescription>
                  Insira as coordenadas de origem e destino para calcular a rota mais segura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Origem - Latitude</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={origemLat}
                      onChange={(e) => setOrigemLat(parseFloat(e.target.value))}
                      placeholder="-8.05"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Origem - Longitude</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={origemLon}
                      onChange={(e) => setOrigemLon(parseFloat(e.target.value))}
                      placeholder="-34.9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Destino - Latitude</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={destinoLat}
                      onChange={(e) => setDestinoLat(parseFloat(e.target.value))}
                      placeholder="-8.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Destino - Longitude</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={destinoLon}
                      onChange={(e) => setDestinoLon(parseFloat(e.target.value))}
                      placeholder="-34.95"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={calculateRoute} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Calculando...' : 'Calcular Rota'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Total de Acidentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-600">{stats.total_acidentes}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Por Cidade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {Object.entries(stats.por_cidade || {}).slice(0, 5).map(([cidade, count]) => (
                        <div key={cidade} className="flex justify-between">
                          <span className="text-sm">{cidade}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Por Tipo de Acidente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {Object.entries(stats.por_tipo || {}).slice(0, 5).map(([tipo, count]) => (
                        <div key={tipo} className="flex justify-between">
                          <span className="text-sm">{tipo}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Por Veículo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {Object.entries(stats.por_veiculo || {}).slice(0, 5).map(([veiculo, count]) => (
                        <div key={veiculo} className="flex justify-between">
                          <span className="text-sm">{veiculo}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Por Condição Climática</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {Object.entries(stats.por_clima || {}).slice(0, 5).map(([clima, count]) => (
                        <div key={clima} className="flex justify-between">
                          <span className="text-sm">{clima}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload de Dados CSV</CardTitle>
                <CardDescription>
                  Faça upload de arquivos CSV com dados de acidentes para análise
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">Selecionar arquivo CSV</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={loading}
                  />
                </div>
                
                {uploadStatus && (
                  <div className={`p-3 rounded ${uploadStatus.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {uploadStatus}
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  <p><strong>Formato esperado:</strong></p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Delimitador: ponto e vírgula (;)</li>
                    <li>Encoding: latin-1</li>
                    <li>Colunas: municipio, tipo_acidente, latitude, longitude, etc.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App
