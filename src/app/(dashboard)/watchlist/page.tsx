"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Search,
  EyeOff,
  Eye,
  Trash2,
  Loader2,
} from "lucide-react";
import { useWatchlist } from "@/hooks/use-watchlist";
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

type SortKey = "added_at" | "token_symbol";
type SortDir = "asc" | "desc";

export default function WatchlistPage() {
  const { items, isLoading, addToken, removeToken, toggleMute } = useWatchlist();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("added_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Add token form
  const [newSymbol, setNewSymbol] = useState("");
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newChain, setNewChain] = useState<Chain>("ethereum");

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

  const filtered = items
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
      <div className="p-4 md:p-6 flex flex-col gap-6 max-w-[1440px] w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-lg font-bold">
            My Watchlist{" "}
            <span className="text-text-secondary font-normal">({items.length})</span>
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
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="size-4 mr-1" />
              Add Token
            </Button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
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
                <TableHeaderCell align="center">Muted</TableHeaderCell>
                <TableHeaderCell
                  sortable
                  sorted={sortKey === "added_at" ? sortDir : false}
                  onClick={() => handleSort("added_at")}
                >
                  Added
                </TableHeaderCell>
                <TableHeaderCell align="right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((item, idx) => (
                <WatchlistRow
                  key={item.id}
                  item={item}
                  index={idx + 1}
                  onToggleMute={() =>
                    toggleMute.mutate({ id: item.id, is_muted: !item.is_muted })
                  }
                  onRemove={() => removeToken.mutate(item.id)}
                />
              ))}
            </TableBody>
          </DataTable>
        )}

        {/* Quick Stats */}
        {items.length > 0 && (
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
function WatchlistRow({
  item,
  index,
  onToggleMute,
  onRemove,
}: {
  item: WatchlistItem;
  index: number;
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
      <TableCell align="center">
        {item.is_muted ? (
          <span className="text-xs text-signal-warning">Muted</span>
        ) : (
          <span className="text-xs text-signal-success">Active</span>
        )}
      </TableCell>
      <TableCell mono className="text-text-secondary text-xs">
        {new Date(item.added_at).toLocaleDateString()}
      </TableCell>
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
    </TableRow>
  );
}
