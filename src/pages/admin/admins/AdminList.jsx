import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, addDoc, query, where } from "firebase/firestore";
import { Plus, Trash2, Shield, User, Mail, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminList() {
    const [admins, setAdmins] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch admins
            const adminsSnapshot = await getDocs(collection(db, "admins"));
            const adminsData = adminsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Fetch students to check if admin has student profile
            const studentsSnapshot = await getDocs(collection(db, "students"));
            const studentsData = studentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Merge data to show if admin has student profile
            const enrichedAdmins = adminsData.map(admin => {
                const studentProfile = studentsData.find(s => s.email === admin.email);
                return {
                    ...admin,
                    hasStudentProfile: !!studentProfile,
                    studentName: studentProfile?.name || null
                };
            });

            setAdmins(enrichedAdmins);
            setStudents(studentsData);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Erro ao carregar dados");
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!newAdminEmail || !newAdminEmail.includes("@")) {
            setError("Por favor, insira um email válido");
            return;
        }

        try {
            // Check if already an admin
            const q = query(collection(db, "admins"), where("email", "==", newAdminEmail));
            const existingAdmin = await getDocs(q);

            if (!existingAdmin.empty) {
                setError("Este email já é um administrador");
                return;
            }

            // Add new admin
            await addDoc(collection(db, "admins"), {
                email: newAdminEmail,
                createdAt: new Date()
            });

            setSuccess("Administrador adicionado com sucesso!");
            setNewAdminEmail("");
            setShowAddForm(false);
            fetchData();
        } catch (error) {
            console.error("Error adding admin:", error);
            setError("Erro ao adicionar administrador");
        }
    };

    const handleDelete = async (id, email) => {
        // Prevent deleting the super admin
        if (email === "and.oenning@gmail.com") {
            setError("Não é possível remover o super administrador");
            return;
        }

        if (window.confirm(`Tem certeza que deseja remover o acesso de administrador de ${email}?`)) {
            try {
                await deleteDoc(doc(db, "admins", id));
                setSuccess("Administrador removido com sucesso!");
                fetchData();
            } catch (error) {
                console.error("Error deleting admin:", error);
                setError("Erro ao remover administrador");
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="text-shino-blue" size={28} />
                        Gestão de Administradores
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Gerencie quem tem acesso ao painel administrativo
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-shino-blue text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Adicionar Admin
                </button>
            </div>

            {/* Success/Error Messages */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                    <CheckCircle size={20} />
                    {success}
                </div>
            )}

            {/* Add Admin Form */}
            {showAddForm && (
                <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Adicionar Novo Administrador</h2>
                    <form onSubmit={handleAddAdmin} className="flex gap-3">
                        <div className="flex-1">
                            <input
                                type="email"
                                value={newAdminEmail}
                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                placeholder="email@exemplo.com"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-shino-blue/20 focus:border-shino-blue transition-all"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-shino-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Adicionar
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddForm(false);
                                setNewAdminEmail("");
                                setError("");
                            }}
                            className="bg-slate-100 text-slate-600 px-6 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                    </form>
                    <p className="text-xs text-slate-500 mt-2">
                        O usuário precisará criar uma conta com este email para ter acesso ao painel admin.
                    </p>
                </div>
            )}

            {/* Admins List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-medium text-slate-500">Email</th>
                            <th className="px-6 py-4 font-medium text-slate-500">Perfil de Aluno</th>
                            <th className="px-6 py-4 font-medium text-slate-500">Adicionado em</th>
                            <th className="px-6 py-4 font-medium text-slate-500 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {admins.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                    Nenhum administrador encontrado
                                </td>
                            </tr>
                        ) : (
                            admins.map((admin) => (
                                <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-shino-blue to-blue-700 rounded-full flex items-center justify-center text-white">
                                                <Shield size={18} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800 flex items-center gap-2">
                                                    {admin.email}
                                                    {admin.email === "and.oenning@gmail.com" && (
                                                        <span className="px-2 py-0.5 bg-shino-yellow text-blue-900 text-xs font-bold rounded-full">
                                                            SUPER ADMIN
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {admin.hasStudentProfile ? (
                                            <div className="flex items-center gap-2 text-green-600">
                                                <CheckCircle size={16} />
                                                <span className="text-sm font-medium">
                                                    {admin.studentName || "Sim"}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-sm">Não</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">
                                        {admin.createdAt ? new Date(admin.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {admin.email !== "and.oenning@gmail.com" ? (
                                                <button
                                                    onClick={() => handleDelete(admin.id, admin.email)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Remover acesso admin"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-400 px-3 py-2">
                                                    Protegido
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Mail size={18} />
                    Como funciona?
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Adicione o email de um usuário para conceder acesso administrativo</li>
                    <li>• O usuário precisa criar uma conta com o email cadastrado</li>
                    <li>• Admins podem ter perfis de aluno para visualizar conteúdo</li>
                    <li>• O super admin (and.oenning@gmail.com) não pode ser removido</li>
                </ul>
            </div>
        </div>
    );
}
