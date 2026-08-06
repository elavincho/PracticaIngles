import React, { useState, useEffect } from 'react';
import { VocabularyWord } from '../../types';
import { api } from '../../services/api';
import { Plus, Edit3, Trash2, Search, Filter, Volume2, AlertTriangle, ExternalLink } from 'lucide-react';

export const VocabCrud: React.FC = () => {
  const [vocabList, setVocabList] = useState<VocabularyWord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | ''>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<VocabularyWord>>({
    word: '',
    translation: '',
    phonetic: '',
    category: 'Saludos y presentaciones',
    level: 1,
    imageUrl: '',
    exampleSentenceEn: '',
    exampleSentenceEs: ''
  });

  const loadData = async () => {
    try {
      const data = await api.getVocabulary(
        selectedLevel ? Number(selectedLevel) : undefined,
        selectedCategory || undefined,
        searchTerm || undefined
      );
      setVocabList(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedLevel, selectedCategory, searchTerm]);

  const [isSaving, setIsSaving] = useState(false);

  const handleOpenCreate = () => {
    setFormData({
      word: '',
      translation: '',
      phonetic: '',
      category: 'Saludos y presentaciones',
      level: 1,
      imageUrl: 'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?auto=format&fit=crop&w=400&q=80',
      exampleSentenceEn: '',
      exampleSentenceEs: ''
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (w: VocabularyWord) => {
    setEditingWord(w);
    setFormData({ ...w });
  };

  const handleSaveWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    try {
      setIsSaving(true);
      const cleanedData = {
        ...formData,
        imageUrl: formData.imageUrl ? formData.imageUrl.trim() : ''
      };

      if (editingWord) {
        const targetId = editingWord._id || editingWord.id || editingWord.word || '';
        await api.updateWord(targetId, cleanedData);
      } else {
        await api.createWord(cleanedData);
      }

      await loadData();
      setIsCreateOpen(false);
      setEditingWord(null);
    } catch (err: any) {
      alert(err.message || 'Error guardando palabra');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Desea eliminar esta palabra del vocabulario?')) {
      try {
        await api.deleteWord(id);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Error eliminando palabra');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar en inglés o español..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value ? Number(e.target.value) : '')}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="">Todos los Niveles</option>
            {[1, 2, 3, 4, 5].map(lvl => (
              <option key={lvl} value={lvl}>Nivel {lvl}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Palabra</span>
        </button>
      </div>

      {/* Vocab Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Mostrando {vocabList.length} palabra{vocabList.length !== 1 ? 's' : ''} {selectedLevel ? `del Nivel ${selectedLevel}` : 'registradas'}
          </h4>
          <span className="text-[10px] font-semibold text-slate-400">
            Orden correlativo #1 a #{vocabList.length}
          </span>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="p-4 text-center w-14">#</th>
                <th className="p-4">Palabra (Inglés)</th>
                <th className="p-4">Traducción</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Nivel</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {vocabList.map((item, idx) => (
                <tr key={item._id || item.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 text-center font-bold text-slate-400 text-xs">
                    {idx + 1}
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.word} className="w-7 h-7 rounded-lg object-cover" />
                      )}
                      <div>
                        <span>{item.word}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">{item.phonetic}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                    {item.translation}
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full text-[10px] font-bold">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold px-2.5 py-1 rounded-full text-[10px]">
                      Nivel {item.level}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600"
                        title="Editar palabra"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id || item.id || '')}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600"
                        title="Eliminar palabra"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Word */}
      {(isCreateOpen || editingWord) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingWord ? 'Editar Palabra A1' : 'Agregar Nueva Palabra A1'}
            </h3>
            <form onSubmit={handleSaveWord} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Palabra (Inglés)</label>
                  <input
                    type="text"
                    required
                    value={formData.word}
                    onChange={e => setFormData({ ...formData, word: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Traducción (Español)</label>
                  <input
                    type="text"
                    required
                    value={formData.translation}
                    onChange={e => setFormData({ ...formData, translation: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Fonética</label>
                  <input
                    type="text"
                    value={formData.phonetic}
                    onChange={e => setFormData({ ...formData, phonetic: e.target.value })}
                    placeholder="/ˈæp.əl/"
                    className="w-full bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Nivel (1-5)</label>
                  <select
                    value={formData.level}
                    onChange={e => setFormData({ ...formData, level: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-xl outline-none font-bold"
                  >
                    {[1, 2, 3, 4, 5].map(l => (
                      <option key={l} value={l}>Nivel {l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Categoría</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Saludos y presentaciones, Familia, Comida..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">URL de Imagen</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={formData.imageUrl || ''}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-xl outline-none text-xs"
                  />
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt="Vista previa"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                  ) : null}
                </div>

                {/* Warning if user pasted Unsplash webpage URL instead of direct image URL */}
                {formData.imageUrl && formData.imageUrl.includes('unsplash.com/') && !formData.imageUrl.includes('images.unsplash.com') && (
                  <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                    <p className="font-bold flex items-center gap-1 mb-1 text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      Enlace de página web detectado
                    </p>
                    <p className="leading-snug mb-1">
                      Has pegado la URL de la página web de Unsplash (<code className="bg-amber-100 dark:bg-amber-900/80 px-1 py-0.5 rounded text-[11px]">unsplash.com/es/fotos/...</code>). Las páginas web no se muestran en las tarjetas.
                    </p>
                    <p className="font-semibold text-[11px] text-amber-800 dark:text-amber-300 mb-1">
                      Para obtener el enlace directo a la imagen en Unsplash:
                    </p>
                    <ol className="list-decimal list-inside space-y-0.5 text-[11px] opacity-90 pl-1">
                      <li>Abre la foto en Unsplash.</li>
                      <li>Haz <strong>clic derecho sobre la foto</strong>.</li>
                      <li>Selecciona <strong>"Copiar dirección de la imagen"</strong>.</li>
                      <li>Pégala aquí (debe empezar con <code className="bg-amber-100 dark:bg-amber-900/80 px-1 py-0.5 rounded text-[10px]">https://images.unsplash.com/photo-...</code>).</li>
                    </ol>
                  </div>
                )}

                <p className="text-[10px] text-slate-500 mt-1">
                  Puedes pegar cualquier URL directa de imagen (.jpg, .png, .webp) de Unsplash, Pexels, Pixabay, Imgur, Wikipedia, etc.
                </p>
              </div>

              <div>
                <label className="font-semibold block mb-1">Frase de Ejemplo (Inglés)</label>
                <input
                  type="text"
                  value={formData.exampleSentenceEn}
                  onChange={e => setFormData({ ...formData, exampleSentenceEn: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Frase de Ejemplo (Español)</label>
                <input
                  type="text"
                  value={formData.exampleSentenceEs}
                  onChange={e => setFormData({ ...formData, exampleSentenceEs: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsCreateOpen(false); setEditingWord(null); }}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Guardando...
                    </>
                  ) : (
                    'Guardar Palabra'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
