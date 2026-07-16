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
      <div className="h-full flex flex-col gap-5 max-w-[1000px] mx-auto">
        <Panel className="shrink-0 p-0 overflow-visible border-none bg-transparent">
          <div className="flex items-center pb-2 border-b border-[var(--border)]">
            <div className="flex gap-6">
              {["assets", "settings"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-2 text-[13px] font-medium capitalize transition-colors border-b-2 -mb-[3px] ${
                    activeTab === tab 
                      ? 'text-[var(--text-primary)] border-[var(--accent)]' 
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {tab} Configuration
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

  if (isLoading) return <LoadingPanel title="Loading Assets" />;
  if (error) return <ErrorPanel title="Admin Error" error={error} />;

  return (
    <Panel title="Tracked Assets Management" className="h-full" noPadding>
      <div className="flex flex-col h-full">
        {/* Add Form */}
        <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-base)] shrink-0">
          <h3 className="text-[13px] font-medium text-[var(--text-primary)] mb-3">Add New Asset</h3>
          <form onSubmit={handleAdd} className="flex gap-3">
            <input
              type="text"
              placeholder="Symbol (e.g. AAPL)"
              value={newSymbol}
              onChange={e => setNewSymbol(e.target.value)}
              className="bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] text-[13px] px-3 py-2 rounded-[8px] focus:outline-none focus:border-[var(--text-secondary)] uppercase w-32 placeholder:normal-case"
              required
            />
            <input
              type="text"
              placeholder="Company Name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] text-[13px] px-3 py-2 rounded-[8px] focus:outline-none focus:border-[var(--text-secondary)] flex-1"
              required
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] text-[13px] px-3 py-2 rounded-[8px] focus:outline-none focus:border-[var(--text-secondary)]"
            >
              <option value="stocks">Stocks</option>
              <option value="indices">Indices</option>
              <option value="crypto">Crypto</option>
              <option value="commodities">Commodities</option>
              <option value="currencies">FX</option>
            </select>
            <button
              type="submit"
              disabled={createAsset.isPending}
              className="bg-[var(--accent)] text-white px-4 py-2 text-[13px] font-medium rounded-[8px] hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> Add Asset
            </button>
          </form>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="sticky top-0 bg-[var(--bg-surface)] z-10 text-[var(--text-muted)] text-[11px] uppercase tracking-[0.04em] border-b border-[var(--border)] shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
              <tr>
                <th className="py-3 px-5 font-medium">Symbol</th>
                <th className="py-3 px-5 font-medium">Name</th>
                <th className="py-3 px-5 font-medium">Category</th>
                <th className="py-3 px-5 font-medium">Status</th>
                <th className="py-3 px-5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {assets?.map((asset) => (
                <tr key={asset.id} className="hover:bg-[var(--bg-elevated)] transition-colors h-[44px]">
                  <td className="py-2 px-5 font-medium text-[var(--text-primary)]">{asset.symbol}</td>
                  <td className="py-2 px-5 text-[var(--text-secondary)]">{asset.name}</td>
                  <td className="py-2 px-5 uppercase text-[11px] text-[var(--text-muted)]">{asset.category}</td>
                  <td className="py-2 px-5">
                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold tracking-[0.04em] ${asset.isActive ? 'bg-[rgba(34,197,94,0.1)] text-[var(--positive)]' : 'bg-[rgba(239,68,68,0.1)] text-[var(--negative)]'}`}>
                      {asset.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="py-2 px-5 text-right">
                    <button
                      onClick={() => handleDelete(asset.id)}
                      disabled={deleteAsset.isPending}
                      className="text-[var(--text-muted)] hover:text-[var(--negative)] p-1.5 rounded-[6px] hover:bg-[rgba(239,68,68,0.1)] transition-colors"
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
    theme: "dark",
    enableAiSummaries: true
  });

  // Init form
  const initRef = useRef(false);
  if (settings && !initRef.current) {
    setForm({
      refreshInterval: settings.refreshInterval,
      theme: settings.theme === "matrix" ? "dark" : settings.theme, // Override matrix to dark
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
        setSuccessMsg("Settings saved successfully.");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    });
  };

  if (isLoading) return <LoadingPanel title="Loading Settings" />;

  return (
    <Panel title="Global System Settings" className="h-full">
      <div className="max-w-md mt-4">
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-[0.04em]">Data Refresh Interval (Seconds)</label>
            <input
              type="number"
              value={form.refreshInterval}
              onChange={e => setForm({...form, refreshInterval: parseInt(e.target.value)})}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] text-[14px] px-3 py-2 rounded-[8px] focus:outline-none focus:border-[var(--text-secondary)]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-[0.04em]">System Theme</label>
            <select
              value={form.theme}
              onChange={e => setForm({...form, theme: e.target.value})}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] text-[14px] px-3 py-2 rounded-[8px] focus:outline-none focus:border-[var(--text-secondary)] appearance-none"
            >
              <option value="dark">Institutional Dark</option>
              <option value="light" disabled>Light (Coming Soon)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <input
              type="checkbox"
              id="ai-toggle"
              checked={form.enableAiSummaries}
              onChange={e => setForm({...form, enableAiSummaries: e.target.checked})}
              className="w-4 h-4 accent-[var(--accent)] cursor-pointer rounded border-[var(--border)]"
            />
            <label htmlFor="ai-toggle" className="text-[14px] text-[var(--text-primary)] cursor-pointer font-medium">
              Enable AI Market Summaries
            </label>
          </div>

          <div className="pt-6 flex items-center justify-between border-t border-[var(--border-subtle)] mt-2">
            <span className="text-[var(--positive)] text-[13px] font-medium">{successMsg}</span>
            <button
              type="submit"
              disabled={updateSettings.isPending}
              className="bg-[var(--accent)] text-white px-6 py-2 rounded-[8px] text-[13px] font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        </form>
      </div>
    </Panel>
  );
}
