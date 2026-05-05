import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Search, 
  ExternalLink, 
  Building2, 
  Calculator, 
  FileSignature, 
  Briefcase,
  Users,
  LayoutDashboard,
  Mail,
  LogIn,
  LogOut,
  Trash2,
  Edit,
  X,
  Check,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import React from "react";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';
import { Tool } from "./types";

const iconMap: Record<string, any> = {
  Building2,
  Calculator,
  FileSignature,
  Briefcase,
  Users,
  LayoutDashboard,
  Mail
};

const CATEGORIES = ["Administração", "Vendas", "Atendimento", "Utilitários"] as const;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [formData, setFormData] = useState<Partial<Tool>>({
    name: "",
    description: "",
    url: "",
    icon: "Building2",
    category: "Administração",
    tags: []
  });

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Data Listener
  useEffect(() => {
    if (!user) {
      setTools([]);
      return;
    }

    setLoading(true);
    const q = query(collection(db, "tools"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const toolList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tool[];
      setTools(toolList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "tools");
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const toolData = {
      ...formData,
      ownerId: user.uid,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingTool?.id) {
        await updateDoc(doc(db, "tools", editingTool.id), toolData as any);
      } else {
        await addDoc(collection(db, "tools"), {
          ...toolData,
          createdAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      setEditingTool(null);
      setFormData({ name: "", description: "", url: "", icon: "Building2", category: "Administração", tags: [] });
    } catch (error) {
      handleFirestoreError(error, editingTool ? OperationType.UPDATE : OperationType.CREATE, "tools");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta ferramenta?")) return;
    try {
      await deleteDoc(doc(db, "tools", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tools/${id}`);
    }
  };

  const openEdit = (tool: Tool) => {
    setEditingTool(tool);
    setFormData({
      name: tool.name,
      description: tool.description,
      url: tool.url,
      icon: tool.icon,
      category: tool.category,
      tags: tool.tags
    });
    setIsModalOpen(true);
  };

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? tool.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[2rem] shadow-2xl border border-[#E0E0E0] max-w-md w-full text-center"
        >
          <img src="https://i.postimg.cc/YCtSsSSW/logo2024.png" alt="Logo" className="h-24 mx-auto mb-8 object-contain" referrerPolicy="no-referrer" />
          <h1 className="text-3xl font-black text-[#2D3436] mb-4 tracking-tight">Portal de Sistemas</h1>
          <p className="text-[#636E72] mb-10 leading-relaxed">
            Acesse com seu e-mail corporativo para gerenciar e visualizar as ferramentas da Morada Urbana.
          </p>
          <button 
            onClick={handleLogin}
            className="w-full bg-[#2D3436] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-[#000000] transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            <LogIn size={20} />
            Entrar com Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      <div className="h-2 bg-[#2D3436]"></div>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-[#E0E0E0]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-[#2D3436] flex items-center justify-center shadow-lg">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="font-bold text-[#2D3436] text-sm hidden md:block">MORADA URBANA</span>
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pr-4 border-r border-[#E0E0E0]">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black uppercase text-[#BDBDBD] mb-0.5">Operador</p>
                  <p className="text-xs font-bold text-[#2D3436]">{user.displayName}</p>
                </div>
                <img src={user.photoURL || ""} alt="User" className="w-9 h-9 rounded-full border border-[#E0E0E0]" />
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-[#636E72] hover:text-red-500 transition-colors"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div>
              <div className="flex items-center mb-8">
                <img 
                  src="https://i.postimg.cc/YCtSsSSW/logo2024.png" 
                  alt="Morada Urbana Logo" 
                  className="h-20 w-auto object-contain drop-shadow-sm"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#2D3436] mb-4">
                Central de <span className="text-[#636E72]">Ferramentas</span>
              </h1>
              <p className="text-[#636E72] max-w-lg text-lg">
                Seu atalho único para gerenciar todas as operações imobiliárias com agilidade e precisão.
              </p>
            </div>

            <div className="flex flex-col gap-6 bg-white p-6 rounded-2xl shadow-sm border border-[#E0E0E0] w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BDBDBD]" size={20} />
                <input 
                  type="text" 
                  placeholder="Qual ferramenta você precisa?" 
                  className="bg-[#F8F9FA] border border-[#E0E0E0] rounded-xl py-3 pl-12 pr-4 w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-[#2D3436]/10 focus:border-[#2D3436] transition-all placeholder:text-[#BDBDBD]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${!selectedCategory ? 'bg-[#2D3436] border-[#2D3436] text-white' : 'bg-transparent border-[#E0E0E0] text-[#636E72] hover:bg-gray-50'}`}
                >
                  Todas
                </button>
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${selectedCategory === cat ? 'bg-[#2D3436] border-[#2D3436] text-white' : 'bg-transparent border-[#E0E0E0] text-[#636E72] hover:bg-gray-50'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-[#2D3436]" size={48} />
              <p className="font-bold text-[#BDBDBD] animate-pulse">Sincronizando sistemas...</p>
            </div>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {filteredTools.map((tool, index) => {
                  const IconComponent = iconMap[tool.icon] || LayoutDashboard;
                  const isOwner = user?.uid === tool.ownerId;

                  return (
                    <motion.div
                      key={tool.id}
                      layout
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="group relative bg-white border border-[#E0E0E0] rounded-3xl p-8 hover:shadow-2xl hover:shadow-[#2D3436]/5 hover:-translate-y-1 transition-all flex flex-col h-full overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-[#F8F9FA] flex items-center justify-center text-[#2D3436] group-hover:bg-[#2D3436] group-hover:text-white transition-all shadow-inner">
                          <IconComponent size={28} />
                        </div>
                        <div className="flex gap-2">
                          {isOwner && (
                            <div className="flex bg-[#F8F9FA] p-1.5 rounded-lg border border-[#E0E0E0] opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => openEdit(tool)} 
                                className="p-2 text-[#636E72] hover:text-[#0984E3] transition-colors"
                              >
                                <Edit size={18} />
                              </button>
                              <button 
                                onClick={() => tool.id && handleDelete(tool.id)} 
                                className="p-2 text-[#636E72] hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          )}
                          <div className="flex bg-[#F8F9FA] p-1.5 rounded-lg border border-[#E0E0E0]">
                            <a 
                              href={tool.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-2 text-[#636E72] hover:text-[#2D3436] transition-colors"
                              title="Acessar agora"
                            >
                              <ExternalLink size={20} />
                            </a>
                          </div>
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-[#2D3436] mb-4 group-hover:text-[#0984E3] transition-colors tracking-tight">
                        {tool.name}
                      </h3>
                      <p className="text-[#636E72] text-sm leading-relaxed mb-10 flex-grow text-balance">
                        {tool.description}
                      </p>

                      <div className="flex items-center justify-between mt-auto pt-6 border-t border-[#F1F2F6]">
                        <div className="flex flex-wrap gap-1.5">
                          {tool.tags.map(tag => (
                            <span key={tag} className="text-[10px] font-bold uppercase tracking-widest text-[#BDBDBD]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] font-black uppercase text-[#2D3436]/40 bg-[#F1F2F6] px-2 py-1 rounded">
                          {tool.category}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <motion.div
                layout
                className="border-2 border-dashed border-[#E0E0E0] rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-6 hover:border-[#2D3436] hover:bg-white transition-all cursor-pointer group min-h-[300px]"
                onClick={() => {
                  setEditingTool(null);
                  setFormData({ name: "", description: "", url: "", icon: "Building2", category: "Administração", tags: [] });
                  setIsModalOpen(true);
                }}
              >
                <div className="w-16 h-16 rounded-full border-2 border-[#E0E0E0] flex items-center justify-center text-[#BDBDBD] group-hover:border-[#2D3436] group-hover:text-[#2D3436] transition-all">
                  <Plus size={32} />
                </div>
                <div>
                  <p className="font-bold text-[#2D3436]">Nova Ferramenta</p>
                  <p className="text-sm text-[#636E72] mt-2 italic">Adicione um novo atalho para a equipe.</p>
                </div>
              </motion.div>
            </>
          )}
        </section>

        <footer className="mt-32 pt-10 border-t border-[#E0E0E0] flex flex-col md:flex-row justify-between items-center gap-6 text-[#BDBDBD] text-xs font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Sistemas Ativos // 2026
          </div>
          <p>Morada Urbana - Inteligência Imobiliária</p>
        </footer>
      </main>

      {/* Modal Tool CRUD */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#2D3436]/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden"
            >
              <div className="p-8 md:p-12">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-black text-[#2D3436] tracking-tight">
                    {editingTool ? "Editar Ferramenta" : "Nova Ferramenta"}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#F8F9FA] rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-[#BDBDBD] tracking-widest pl-1">Nome</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-[#F8F9FA] border border-[#E0E0E0] rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#2D3436]/10 focus:border-[#2D3436] outline-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-[#BDBDBD] tracking-widest pl-1">Categoria</label>
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                        className="w-full bg-[#F8F9FA] border border-[#E0E0E0] rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#2D3436]/10 focus:border-[#2D3436] outline-none"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[#BDBDBD] tracking-widest pl-1">URL de Acesso</label>
                    <input 
                      required
                      type="url" 
                      value={formData.url}
                      onChange={e => setFormData({ ...formData, url: e.target.value })}
                      className="w-full bg-[#F8F9FA] border border-[#E0E0E0] rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#2D3436]/10 focus:border-[#2D3436] outline-none" 
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[#BDBDBD] tracking-widest pl-1">Descrição Curta</label>
                    <textarea 
                      required
                      rows={2}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-[#F8F9FA] border border-[#E0E0E0] rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#2D3436]/10 focus:border-[#2D3436] outline-none resize-none"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-[#BDBDBD] tracking-widest pl-1">Ícone</label>
                      <select 
                        value={formData.icon}
                        onChange={e => setFormData({ ...formData, icon: e.target.value })}
                        className="w-full bg-[#F8F9FA] border border-[#E0E0E0] rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#2D3436]/10 focus:border-[#2D3436] outline-none"
                      >
                        {Object.keys(iconMap).map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-[#BDBDBD] tracking-widest pl-1">Tags (Separadas por vírgula)</label>
                      <input 
                        type="text" 
                        value={formData.tags?.join(", ")}
                        onChange={e => setFormData({ ...formData, tags: e.target.value.split(",").map(t => t.trim()).filter(t => t) })}
                        className="w-full bg-[#F8F9FA] border border-[#E0E0E0] rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#2D3436]/10 focus:border-[#2D3436] outline-none" 
                      />
                    </div>
                  </div>

                  <div className="pt-8 flex gap-4">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-4 px-6 rounded-xl border border-[#E0E0E0] font-bold text-[#636E72] hover:bg-[#F8F9FA] transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-4 px-6 rounded-xl bg-[#2D3436] text-white font-bold flex items-center justify-center gap-3 hover:bg-[#000000] transition-all shadow-lg"
                    >
                      <Check size={20} />
                      {editingTool ? "Salvar Alterações" : "Criar Atalho"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
