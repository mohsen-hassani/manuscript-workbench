import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, RefreshCcw } from 'lucide-react';
import { clsx } from 'clsx';

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
  fileId?: number;
}

interface FileTreeItemProps {
  node: TreeNode;
  level: number;
  selectedId?: string;
  onSelect: (node: TreeNode) => void;
  onSync?: (fileId: number) => void;
}

export function FileTreeItem({ node, level, selectedId, onSelect, onSync }: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const isSelected = selectedId === node.id;
  const isFolder = node.type === 'folder';
  const hasChildren = node.children && node.children.length > 0;

  const handleClick = () => {
    if (isFolder && hasChildren) {
      setIsExpanded(!isExpanded);
    }
    onSelect(node);
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className={clsx(
          'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm',
          'hover:bg-dark-700 transition-colors',
          isSelected && 'bg-dark-700 text-accent-purple',
          !isSelected && 'text-gray-300'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {isFolder ? (
          <>
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
              )
            ) : (
              <span className="w-4" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-4" />
            <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="truncate flex-1">{node.name}</span>
            {onSync && node.fileId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSync(node.fileId!);
                }}
                className="p-1 hover:bg-dark-600 rounded text-gray-400 hover:text-accent-purple transition-colors"
                title="Sync file"
              >
                <RefreshCcw className="w-3 h-3" />
              </button>
            )}
          </>
        )}
        {isFolder && <span className="truncate">{node.name}</span>}
      </div>

      {isFolder && isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onSync={onSync}
            />
          ))}
        </div>
      )}
    </div>
  );
}
