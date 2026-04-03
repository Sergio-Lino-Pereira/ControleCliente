import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Servicos } from './pages/Servicos';
import { Contato } from './pages/Contato';
import { Login } from './pages/Login';
import { Cadastro } from './pages/Cadastro';
import { Restricted } from './pages/Restricted';
import { PublicBooking } from './pages/PublicBooking';
import { ConfigHorarios } from './pages/ConfigHorarios';
import { Agenda } from './pages/Agenda';
import { Profissionais } from './pages/Profissionais';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/servicos" element={<Servicos />} />
                        <Route path="/profissionais" element={<Profissionais />} />
                        <Route path="/contato" element={<Contato />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/cadastro" element={<Cadastro />} />
                        <Route
                            path="/restricted"
                            element={
                                <ProtectedRoute>
                                    <Restricted />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/agenda"
                            element={
                                <ProtectedRoute>
                                    <Agenda />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/config-horarios"
                            element={
                                <ProtectedRoute>
                                    <ConfigHorarios />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/agendar/:slug" element={<PublicBooking />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Layout>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
