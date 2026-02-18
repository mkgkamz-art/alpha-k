"use client";

import { memo, useState, useCallback } from "react";
import {
  Plus,
  Search,
  EyeOff,
  Eye,
  Trash2,
  Lock,
  Loader2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useAuthStore } from "@/stores/auth-store";
import { ACCESS_MATRIX } from "@/lib/subscription";
import { AuthGate } from "@/components/auth-gate";
import { SurgeSideWidget, KimchiSideWidget, ListingSideWidget } from "@/components/widgets";
import {
  DataTable,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  StatCard,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
} from "@/components/ui";
import type { WatchlistItem, Chain } from "@/types";

/* ── Token Color Map ── */
const tokenColors: Record<string, string> = {
  BTC: "#f7931a",
  ETH: "#627eea",
  SOL: "#14F195",
  ARB: "#2D374B",
  OP: "#FF0420",
  USDC: "#2775CA",
  LINK: "#375BD2",
  UNI: "#ff007a",
  AAVE: "#B6509E",
  MKR: "#1AAB9B",
};

/* ── Default tokens for unauthenticated users ── */
const defaultTokens: WatchlistItem[] = [
  { id: "def-btc", user_id: "", token_symbol: "BTC", token_name: "Bitcoin", token_address: "", chain: "ethereum", is_muted: false, added_at: new Date().toISOString() },
  { id: "def-eth", user_id: "", token_symbol: "ETH", token_name: "Ethereum", token_address: "", chain: "ethereum", is_muted: false, added_at: new Date().toISOString() },
  { id: "def-sol", user_id: "", token_symbol: "SOL", token_name: "Solana", token_address: "", chain: "solana", is_muted: false, added_at: new Date().toISOString() },
  { id: "def-arb", user_id: "", token_symbol: "ARB", token_name: "Arbitrum", token_address: "", chain: "arbitrum", is_muted: false, added_at: new Date().toISOString() },
  { id: "def-op", user_id: "", token_symbol: "OP", token_name: "Optimism", token_address: "", chain: "ethereum", is_muted: false, added_at: new Date().toISOString() },
  { id: "def-link", user_id: "", token_symbol: "LINK", token_name: "Chainlink", token_address: "", chain: "ethereum", is_muted: false, added_at: new Date().toISOString() },
  { id: "def-uni", user_id: "", token_symbol: "UNI", token_name: "Uniswap", token_address: "", chain: "ethereum", is_muted: false, added_at: new Date().toISOString() },
  { id: "def-aave", user_id: "", token_symbol: "AAVE", token_name: "Aave", token_address: "", chain: "ethereum", is_muted: false, added_at: new Date().toISOString() },
  { id: "def-mkr", user_id: "", token_symbol: "MKR", token_name: "Maker", token_address: "", chain: "ethereum", is_muted: false, added_at: new Date().toISOString() },
  { id: "def-usdc", user_id: "", token_symbol: "USDC", token_name: "USD Coin", token_address: "", chain: "ethereum", is_muted: false, added_at: new Date().toISOString() },
];

type SortKey = "added_at" | "token_symbol";
type SortDir = "asc" | "desc";

export default function WatchlistPage() {
  const user = useAuthStore((s) => s.user);
  const isPro = useAuthStore((s) => s.isPro);
  const { items, isLoading, addToken, removeToken, toggleMute } = useWatchlist();
  const freeLimit = ACCESS_MATRIX.watchlist.free.maxCoins;
  const isAtFreeLimit = !isPro && user && items.length >= freeLimit;
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("added_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Add token form
  const [newSymbol, setNewSymbol] = useState("");
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newChain, setNewChain] = useState<Chain>("ethereum");

  // Use default tokens for unauthenticated users
  const displayItems = user ? items : defaultTokens;

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey]
  );

  const filtered = displayItems
    .filter(
      (item) =>
        item.token_symbol.toLowerCase().includes(search.toLowerCase()) ||
        item.token_name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "token_symbol") {
        return a.token_symbol.localeCompare(b.token_symbol) * dir;
      }
      return (new Date(a.added_at).getTime() - new Date(b.added_at).getTime()) * dir;
    });

  const handleAddToken = () => {
    if (!newSymbol.trim()) return;
    addToken.mutate(
      {
        token_symbol: newSymbol.toUpperCase(),
        token_name: newName || newSymbol.toUpperCase(),
        token_address: newAddress,
        chain: newChain,
      },
      {
        onSuccess: () => {
          setAddModalOpen(false);
          setNewSymbol("");
          setNewName("");
          setNewAddress("");
          setNewChain("ethereum");
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 flex flex-col gap-6 max-w-screen-2xl w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-lg font-bold">
            {user ? "My Watchlist" : "Popular Tokens"}{" "}
            <span className="text-text-secondary font-normal">({displayItems.length})</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
              <Input
                placeholder="Search tokens..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <AuthGate message="Sign in to add tokens to your watchlist">
              {isAtFreeLimit ? (
                <Link
                  href="/billing"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-primary/10 text-accent-primary text-xs font-medium hover:bg-accent-primary/20 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {freeLimit}개 한도 · Pro 업그레이드
                </Link>
              ) : (
                <Button onClick={() => setAddModalOpen(true)}>
                  <Plus className="size-4 mr-1" />
                  Add Token
                </Button>
              )}
            </AuthGate>
          </div>
        </div>

        {/* Table */}
        {isLoading && user ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 text-text-secondary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
            <p className="text-sm">
              {search ? "No tokens match your search." : "Your watchlist is empty."}
            </p>
            {!search && (
              <p className="text-xs mt-1">
                Add tokens to track their alerts and whale activity.
              </p>
            )}
          </div>
        ) : (
          <DataTable>
            <TableHead>
              <TableRow hoverable={false}>
                <TableHeaderCell className="w-12 text-center">#</TableHeaderCell>
                <TableHeaderCell
                  sortable
                  sorted={sortKey === "token_symbol" ? sortDir : false}
                  onClick={() => handleSort("token_symbol")}
                >
                  Token
                </TableHeaderCell>
                <TableHeaderCell>Chain</TableHeaderCell>
                {user && <TableHeaderCell align="center">Muted</TableHeaderCell>}
                <TableHeaderCell
                  sortable
                  sorted={sortKey === "added_at" ? sortDir : false}
                  onClick={() => handleSort("added_at")}
                >
                  Added
                </TableHeaderCell>
                {user && <TableHeaderCell align="right">Actions</TableHeaderCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((item, idx) => (
                <WatchlistRow
                  key={item.id}
                  item={item}
                  index={idx + 1}
                  showActions={!!user}
                  onToggleMute={() =>
                    toggleMute.mutate({ id: item.id, is_muted: !item.is_muted })
                  }
                  onRemove={() => removeToken.mutate(item.id)}
                />
              ))}
            </TableBody>
          </DataTable>
        )}

        {/* Watchlist limit notice (Free users) */}
        {isAtFreeLimit && (
          <div className="flex items-center justify-between bg-bg-secondary border border-accent-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent-primary" />
              <p className="text-sm text-text-secondary">
                워치리스트 <span className="font-medium text-text-primary">{freeLimit}개</span> 한도에 도달했습니다
              </p>
            </div>
            <Link
              href="/billing"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-primary text-bg-primary text-xs font-semibold hover:bg-accent-primary/90 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Pro 업그레이드
            </Link>
          </div>
        )}

        {/* Quick Stats — only for authenticated users with tokens */}
        {user && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Total Tokens"
              value={items.length}
              borderColor="primary"
            />
            <StatCard
              label="Active (Unmuted)"
              value={items.filter((i) => !i.is_muted).length}
              borderColor="success"
            />
            <StatCard
              label="Muted"
              value={items.filter((i) => i.is_muted).length}
              borderColor="warning"
            />
          </div>
        )}

        {/* ── 관련 기능 ── */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            관련 기능
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SurgeSideWidget />
            <KimchiSideWidget />
            <ListingSideWidget />
          </div>
        </div>
      </div>

      {/* Add Token Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)}>
        <ModalContent>
          <ModalHeader onClose={() => setAddModalOpen(false)}>
            Add Token to Watchlist
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-text-secondary uppercase font-bold mb-1 block">
                  Symbol *
                </label>
                <Input
                  placeholder="e.g. BTC"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary uppercase font-bold mb-1 block">
                  Token Name
                </label>
                <Input
                  placeholder="e.g. Bitcoin"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary uppercase font-bold mb-1 block">
                  Contract Address
                </label>
                <Input
                  placeholder="0x..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary uppercase font-bold mb-1 block">
                  Chain *
                </label>
                <Select
                  value={newChain}
                  onChange={(e) => setNewChain(e.target.value as Chain)}
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="solana">Solana</option>
                  <option value="bsc">BSC</option>
                  <option value="polygon">Polygon</option>
                  <option value="arbitrum">Arbitrum</option>
                </Select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => setAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToken}
              disabled={!newSymbol.trim() || addToken.isPending}
            >
              {addToken.isPending ? (
                <Loader2 className="size-4 animate-spin mr-1" />
              ) : (
                <Plus className="size-4 mr-1" />
              )}
              Add Token
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

/* ── Row Component ── */
const WatchlistRow = memo(function WatchlistRow({
  item,
  index,
  showActions,
  onToggleMute,
  onRemove,
}: {
  item: WatchlistItem;
  index: number;
  showActions: boolean;
  onToggleMute: () => void;
  onRemove: () => void;
}) {
  const bgColor = tokenColors[item.token_symbol] ?? "#474D57";

  return (
    <TableRow>
      <TableCell align="center" mono className="text-text-secondary">
        {index}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div
            className="size-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0"
            style={{ backgroundColor: bgColor }}
          >
            {item.token_symbol.slice(0, 3)}
          </div>
          <div>
            <div className="font-bold text-text-primary text-sm">{item.token_name}</div>
            <div className="text-[10px] text-text-secondary">{item.token_symbol}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-xs text-text-secondary capitalize">{item.chain}</span>
      </TableCell>
      {showActions && (
        <TableCell align="center">
          {item.is_muted ? (
            <span className="text-xs text-signal-warning">Muted</span>
          ) : (
            <span className="text-xs text-signal-success">Active</span>
          )}
        </TableCell>
      )}
      <TableCell mono className="text-text-secondary text-xs">
        {new Date(item.added_at).toLocaleDateString()}
      </TableCell>
      {showActions && (
        <TableCell align="right">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              className="p-1 text-text-disabled hover:text-text-primary transition-colors"
              aria-label={item.is_muted ? "Unmute" : "Mute"}
            >
              {item.is_muted ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-1 text-text-disabled hover:text-signal-danger transition-colors"
              aria-label="Remove from watchlist"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
});
