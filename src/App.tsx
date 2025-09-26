import React, { useState, useEffect, createContext, useContext } from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
	useNavigate,
	useLocation
} from "react-router-dom";
import {
	User,
	LogOut,
	Shield,
	AlertCircle,
	CheckCircle,
	Loader2,
	XCircle,
	ArrowLeft
} from "lucide-react";

// Tipos
interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

interface UserPayload {
	id: number;
	email: string;
	name: string;
	establishment: {
		id: number;
		nit: string;
		bussinesName: string;
		bussinesGroup: string | null;
	};
	privilegesByModule: Array<{
		module: {
			id: number;
			name: string;
			enabled: boolean;
		};
		privileges: Record<string, boolean>;
	}>;
}

// Context para autenticación
interface AuthContextType {
	user: UserPayload | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: () => void;
	logout: () => void;
	testAuth: () => Promise<void>;
	navigate: (path: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook para usar el contexto de autenticación
const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

// Configuración de la API
const API_BASE_URL = "http://ec2-3-23-59-246.us-east-2.compute.amazonaws.com/api/v1"; // Ajusta según tu configuración

// Proveedor de autenticación
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children
}) => {
	const [user, setUser] = useState<UserPayload | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();

	// Función para verificar si el usuario está autenticado
	const checkAuth = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/auth/test`, {
				method: "GET",
				credentials: "include", // Importante para enviar cookies
				headers: {
					"Content-Type": "application/json"
				}
			});

			const data: ApiResponse<UserPayload> = await response.json();

			if (data.success && data.data) {
				setUser(data.data);
				setIsAuthenticated(true);
				console.log("YES");
				navigate("/home");
			} else {
				setUser(null);
				setIsAuthenticated(false);
				// Si el usuario está intentando acceder a rutas protegidas, redirigir al login
				if (
					location.pathname !== "/login" &&
					location.pathname !== "/unauthorized"
				) {
					navigate("/login");
				}
			}
		} catch (error) {
			console.error("Error checking auth:", error);
			setUser(null);
			setIsAuthenticated(false);
			// Si hay error de red o servidor, redirigir al login
			if (
				location.pathname !== "/login" &&
				location.pathname !== "/unauthorized"
			) {
				navigate(
					"/login" +
						((error as ApiResponse<never>).error === "Unauthorized"
							? "error=expired_code"
							: "")
				);
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Verificar autenticación al cargar
	useEffect(() => {
		checkAuth();
	}, []);

	const login = () => {
		window.location.href = `${API_BASE_URL}/auth/google`;
	};

	const logout = async () => {
		try {
			setIsLoading(true);
			const response = await fetch(`${API_BASE_URL}/auth/logout`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json"
				}
			});

			if (response.ok) {
				setUser(null);
				setIsAuthenticated(false);
				// Opcional: redirigir o mostrar mensaje de éxito
				window.location.reload();
			}
		} catch (error) {
			console.error("Error during logout:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const testAuth = async () => {
		await checkAuth();
	};

	const navigateToPath = (path: string) => {
		navigate(path);
	};

	const value: AuthContextType = {
		user,
		isAuthenticated,
		isLoading,
		login,
		logout,
		testAuth,
		navigate: navigateToPath
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Componente de Login
const LoginPage: React.FC = () => {
	const { login, isLoading } = useAuth();
	const [error, setError] = useState<string>("");

	// Verificar si hay error en la URL (código expirado, etc.)
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const errorParam = urlParams.get("error");

		if (errorParam === "expired_code") {
			setError(
				"El código de autorización ha expirado. Por favor, intenta de nuevo."
			);
		}
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
				<div className="text-center mb-8">
					<div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
						<Shield className="w-8 h-8 text-indigo-600" />
					</div>
					<h1 className="text-2xl font-bold text-gray-900 mb-2">BalanceCore</h1>
					<p className="text-gray-600">Inicia sesión para acceder al sistema</p>
				</div>

				{error && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
						<AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
						<div>
							<p className="text-red-800 text-sm">{error}</p>
						</div>
					</div>
				)}

				<button
					onClick={login}
					disabled={isLoading}
					className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
				>
					{isLoading ? (
						<Loader2 className="w-5 h-5 animate-spin mr-2" />
					) : (
						<svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
							<path
								fill="currentColor"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="currentColor"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="currentColor"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="currentColor"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
					)}
					{isLoading ? "Cargando..." : "Iniciar sesión con Google"}
				</button>

				<div className="mt-6 text-center">
					<p className="text-sm text-gray-500">
						Solo usuarios autorizados pueden acceder al sistema
					</p>
				</div>
			</div>
		</div>
	);
};

// Componente de página no autorizada
const UnauthorizedPage: React.FC = () => {
	const { navigate } = useAuth();

	return (
		<div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
				<div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
					<XCircle className="w-8 h-8 text-red-600" />
				</div>

				<h1 className="text-2xl font-bold text-gray-900 mb-4">
					Acceso No Autorizado
				</h1>

				<p className="text-gray-600 mb-6">
					Lo sentimos, no tienes permisos para acceder a esta aplicación. Solo
					usuarios autorizados pueden ingresar al sistema BalanceCore.
				</p>

				<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
					<div className="flex items-start">
						<AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
						<div className="text-left">
							<h3 className="text-sm font-medium text-red-800 mb-1">
								¿Por qué veo este mensaje?
							</h3>
							<ul className="text-sm text-red-700 space-y-1">
								<li>
									• Tu correo electrónico no está registrado en el sistema
								</li>
								<li>• Tu cuenta ha sido desactivada</li>
								<li>• No tienes permisos asignados</li>
							</ul>
						</div>
					</div>
				</div>

				<div className="space-y-3">
					<button
						onClick={() => navigate("/login")}
						className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Volver al Login
					</button>

					<button
						onClick={() =>
							(window.location.href =
								"mailto:admin@balancecore.com?subject=Solicitud de Acceso&body=Hola, me gustaría solicitar acceso al sistema BalanceCore.")
						}
						className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition duration-200"
					>
						Solicitar Acceso
					</button>
				</div>

				<div className="mt-6 pt-4 border-t border-gray-200">
					<p className="text-xs text-gray-500">
						Si crees que esto es un error, contacta al administrador del sistema
					</p>
				</div>
			</div>
		</div>
	);
};

// Componente del Dashboard/Home
const Dashboard: React.FC = () => {
	const { user, logout, testAuth, isLoading } = useAuth();
	const [testResult, setTestResult] = useState<string>("");
	const [testLoading, setTestLoading] = useState(false);

	const handleTestAuth = async () => {
		setTestLoading(true);
		setTestResult("");

		try {
			await testAuth();
			setTestResult("✅ Test de autenticación exitoso");
		} catch (error) {
			console.log(error);
			setTestResult("❌ Error en el test de autenticación");
		} finally {
			setTestLoading(false);
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
					<p className="text-gray-600">Cargando...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<div className="flex items-center">
							<Shield className="w-8 h-8 text-indigo-600 mr-3" />
							<h1 className="text-xl font-semibold text-gray-900">
								BalanceCore Dashboard
							</h1>
						</div>
						<div className="flex items-center space-x-4">
							<div className="flex items-center space-x-2">
								<User className="w-5 h-5 text-gray-500" />
								<span className="text-sm text-gray-700">{user?.email}</span>
							</div>
							<button
								onClick={logout}
								className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
							>
								<LogOut className="w-4 h-4" />
								<span className="text-sm">Cerrar sesión</span>
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{/* Información del usuario */}
					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center mb-4">
							<User className="w-6 h-6 text-indigo-600 mr-2" />
							<h2 className="text-lg font-semibold text-gray-900">
								Información del Usuario
							</h2>
						</div>
						<div className="space-y-2 text-sm">
							<p>
								<span className="font-medium">ID:</span> {user?.id}
							</p>
							<p>
								<span className="font-medium">Email:</span> {user?.email}
							</p>
							<p>
								<span className="font-medium">Nombre:</span> {user?.name}
							</p>
							{user?.establishment && (
								<p>
									<span className="font-medium">Establecimiento:</span>{" "}
									{JSON.stringify(user.establishment)}
								</p>
							)}
						</div>
					</div>

					{/* Test de autenticación */}
					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center mb-4">
							<Shield className="w-6 h-6 text-green-600 mr-2" />
							<h2 className="text-lg font-semibold text-gray-900">
								Test de Autenticación
							</h2>
						</div>
						<button
							onClick={handleTestAuth}
							disabled={testLoading}
							className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center mb-4"
						>
							{testLoading ? (
								<Loader2 className="w-4 h-4 animate-spin mr-2" />
							) : null}
							{testLoading ? "Probando..." : "Probar Autenticación"}
						</button>
						{testResult && (
							<div className="text-sm text-center p-2 bg-gray-50 rounded">
								{testResult}
							</div>
						)}
					</div>

					{/* Privilegios */}
					{user?.privilegesByModule && (
						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center mb-4">
								<CheckCircle className="w-6 h-6 text-blue-600 mr-2" />
								<h2 className="text-lg font-semibold text-gray-900">
									Privilegios
								</h2>
							</div>
							<div className="text-sm">
								<p>{user.privilegesByModule.length} módulos disponibles</p>
								<pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
									{JSON.stringify(user.privilegesByModule, null, 2)}
								</pre>
							</div>
						</div>
					)}
				</div>

				{/* Información adicional */}
				<div className="mt-8 bg-white rounded-lg shadow p-6">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">
						Estado del Sistema
					</h2>
					<div className="grid gap-4 md:grid-cols-3">
						<div className="text-center p-4 bg-green-50 rounded-lg">
							<CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
							<p className="text-sm font-medium text-green-900">Autenticado</p>
							<p className="text-xs text-green-700">Sesión activa</p>
						</div>
						<div className="text-center p-4 bg-blue-50 rounded-lg">
							<Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
							<p className="text-sm font-medium text-blue-900">
								Backend Conectado
							</p>
							<p className="text-xs text-blue-700">API funcionando</p>
						</div>
						<div className="text-center p-4 bg-indigo-50 rounded-lg">
							<User className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
							<p className="text-sm font-medium text-indigo-900">
								Datos Cargados
							</p>
							<p className="text-xs text-indigo-700">Usuario verificado</p>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
	children
}) => {
	const { isAuthenticated, isLoading } = useAuth();
	const location = useLocation();

	// Mientras verifica la autenticación, muestra loading
	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
					<p className="text-gray-600">Verificando permisos...</p>
				</div>
			</div>
		);
	}

	// Si no está autenticado, redirige al login
	if (!isAuthenticated) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	// Si está autenticado, muestra el componente
	return <>{children}</>;
};

// Componente de rutas
const AppRoutes: React.FC = () => {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />
			<Route path="/unauthorized" element={<UnauthorizedPage />} />
			<Route
				path="/dashboard"
				element={
					<ProtectedRoute>
						<Dashboard />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/home"
				element={
					<ProtectedRoute>
						<Dashboard />
					</ProtectedRoute>
				}
			/>
			<Route path="/" element={<Navigate to="/dashboard" replace />} />
			<Route path="*" element={<Navigate to="/login" replace />} />
		</Routes>
	);
};

// Componente principal de la aplicación
const App: React.FC = () => {
	return (
		<Router>
			<AuthProvider>
				<AppRoutes />
			</AuthProvider>
		</Router>
	);
};

export default App;
