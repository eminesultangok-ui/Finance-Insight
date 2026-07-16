import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetAdminAssets, 
  useCreateAdminAsset, 
  useDeleteAdminAsset,
  useUpdateAdminSettings,
  useGetAdminSettings,
  getGetAdminAssetsQueryKey
} from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Panel, LoadingPanel, ErrorPanel } from "@/components/Panel";
import { Trash2, Plus, Save } from "lucide-react";

export default function Admin() {
  const [activeTab, setActiveTab] = useState<"assets" | "settings">("assets");
  
  return (
    <Layout>
      <div className="h-full flex flex-col gap-4 max-w-[1200px] mx-auto">
        <Panel className="shrink-0 p-0 overflow-visible">
          <div className="flex items-center p-2 border-b border-primary/30">
            <div className="flex gap-1">
              {["assets", "settings"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 text-xs font-bold whitespace-nowrap uppercase transition-colors border ${
                    activeTab === tab 
                      ? 'bg-primary/20 text-primary border-primary' 
                      : 'border-transparent text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {tab} CONFIG
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <div className="flex-1 min-h-0">
          {activeTab === "assets" && <AdminAssets />}
          {activeTab === "settings" && <AdminSettings />}
        </div>
      </div>
    </Layout>
  );
}

function AdminAssets() {
  const queryClient = useQueryClient();
  const { data: assets, isLoading, error } = useGetAdminAssets();
  const createAsset = useCreateAdminAsset();
  const deleteAsset = useDeleteAdminAsset();

  const [newSymbol, setNewSymbol] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("stocks");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol || !newName) return;
    
    createAsset.mutate({
      data: {
        symbol: newSymbol.toUpperCase(),
        name: newName,
        category: newCategory as any
      }
    }, {
      onSuccess: () => {
        setNewSymbol("");
        setNewName("");
        queryClient.invalidateQueries({ queryKey: getGetAdminAssetsQueryKey() });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this asset from tracking?")) return;
    deleteAsset.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminAssetsQueryKey() });
      }
    });
  };

  if (isLoading) return <LoadingPanel title="LOADING ASSETS..." />;
  if (error) return <ErrorPanel title="ADMIN ERROR" error={error} />;

  return (
    <Panel title="TRACKED ASSETS MANAGEMENT" className="h-full">
      <div className="flex flex-col h-full gap-4">
        {/* Add Form */}
        <form onSubmit={handleAdd} className="flex gap-4 p-4 border border-primary/30 bg-primary/5 shrink-0">
          <input
            type="text"
            placeholder="SYMBOL (e.g. AAPL)"
            value={newSymbol}
            onChange={e => setNewSymbol(e.target.value)}
            className="bg-black border border-primary/50 text-primary px-3 py-1.5 focus:outline-none focus:border-primary font-mono uppercase w-32"
            required
          />
          <input
            type="text"
            placeholder="COMPANY NAME"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="bg-black border border-primary/50 text-primary px-3 py-1.5 focus:outline-none focus:border-primary font-sans flex-1"
            required
          />
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className="bg-black border border-primary/50 text-primary px-3 py-1.5 focus:outline-none focus:border-primary font-mono"
          >
            <option value="stocks">STOCKS</option>
            <option value="indices">INDICES</option>
            <option value="crypto">CRYPTO</option>
            <option value="commodities">COMMODITIES</option>
            <option value="currencies">FX</option>
          </select>
          <button
            type="submit"
            disabled={createAsset.isPending}
            className="bg-primary/20 text-primary border border-primary px-4 py-1.5 font-bold hover:bg-primary hover:text-black transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> ADD ASSET
          </button>
        </form>

        {/* List */}
        <div className="flex-1 overflow-auto border border-primary/30">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 bg-card z-10 text-muted-foreground text-xs border-b border-primary/30">
              <tr>
                <th className="py-2 px-4 font-normal">SYMBOL</th>
                <th className="py-2 px-4 font-normal">NAME</th>
                <th className="py-2 px-4 font-normal">CATEGORY</th>
                <th className="py-2 px-4 font-normal">STATUS</th>
                <th className="py-2 px-4 font-normal text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10 font-mono">
              {assets?.map((asset) => (
                <tr key={asset.id} className="hover:bg-primary/5 transition-colors">
                  <td className="py-2 px-4 font-bold text-primary">{asset.symbol}</td>
                  <td className="py-2 px-4 text-muted-foreground font-sans">{asset.name}</td>
                  <td className="py-2 px-4 uppercase text-xs">{asset.category}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-0.5 text-[10px] font-bold ${asset.isActive ? 'bg-positive/20 text-positive' : 'bg-destructive/20 text-destructive'}`}>
                      {asset.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-right">
                    <button
                      onClick={() => handleDelete(asset.id)}
                      disabled={deleteAsset.isPending}
                      className="text-destructive hover:text-red-400 p-1"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}

function AdminSettings() {
  const { data: settings, isLoading } = useGetAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    refreshInterval: 30,
    theme: "matrix",
    enableAiSummaries: true
  });

  // Init form
  const initRef = useRef(false);
  if (settings && !initRef.current) {
    setForm({
      refreshInterval: settings.refreshInterval,
      theme: settings.theme,
      enableAiSummaries: settings.enableAiSummaries
    });
    initRef.current = true;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({
      data: {
        ...form,
        theme: form.theme as any
      }
    }, {
      onSuccess: () => {
        setSuccessMsg("SYSTEM CONFIGURATION SAVED.");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    });
  };

  if (isLoading) return <LoadingPanel title="LOADING SETTINGS..." />;

  return (
    <Panel title="GLOBAL SYSTEM SETTINGS" className="h-full">
      <div className="max-w-xl mx-auto mt-8 border border-primary/30 bg-black p-8 relative">
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-primary"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary"></div>

        <form onSubmit={handleSave} className="flex flex-col gap-6 font-mono">
          <div>
            <label className="block text-xs text-muted-foreground mb-2">DATA REFRESH INTERVAL (SECONDS)</label>
            <input
              type="number"
              value={form.refreshInterval}
              onChange={e => setForm({...form, refreshInterval: parseInt(e.target.value)})}
              className="w-full bg-transparent border border-primary/50 text-primary px-4 py-2 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-2">SYSTEM THEME</label>
            <select
              value={form.theme}
              onChange={e => setForm({...form, theme: e.target.value})}
              className="w-full bg-black border border-primary/50 text-primary px-4 py-2 focus:outline-none focus:border-primary appearance-none"
            >
              <option value="matrix">MATRIX TERMINAL</option>
              <option value="dark">DARK MODE</option>
            </select>
          </div>

          <div className="flex items-center gap-4 border border-primary/20 p-4 bg-primary/5">
            <input
              type="checkbox"
              id="ai-toggle"
              checked={form.enableAiSummaries}
              onChange={e => setForm({...form, enableAiSummaries: e.target.checked})}
              className="w-5 h-5 accent-primary bg-black border-primary"
            />
            <label htmlFor="ai-toggle" className="text-sm text-foreground cursor-pointer">
              ENABLE AI MARKET SUMMARIES
            </label>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-primary/30">
            <span className="text-positive text-xs font-bold">{successMsg}</span>
            <button
              type="submit"
              disabled={updateSettings.isPending}
              className="bg-primary text-black px-8 py-2 font-bold hover:bg-white transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> SAVE CONFIG
            </button>
          </div>
        </form>
      </div>
    </Panel>
  );
}
