"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"

// 定义Admin接口
export interface Admin {
  id: string;
  name: string;
  address: string;
  role: string;
  permissions: string[];
  createdAt: string;
}

interface AdminListProps {
  admins: Admin[]
  onDeleteAdmin: (id: string) => void
}

export function AdminList({ admins, onDeleteAdmin }: AdminListProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 打开删除确认对话框
  const handleDeleteConfirm = (id: string) => {
    setDeleteId(id)
    setIsDeleting(true)
  }

  // 执行删除操作
  const handleDelete = async () => {
    if (!deleteId) return

    setIsSubmitting(true)

    try {
      onDeleteAdmin(deleteId) // This updates the local state
      setIsDeleting(false)

      window.alert("Admin deleted successfully.") // 替换 toast
    } catch (error) {
      console.error("Error deleting admin:", error)

      window.alert("Failed to delete admin. Please try again.") // 替换 toast
    } finally {
      setIsSubmitting(false)
    }
  }

  // 格式化地址显示
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <div>
      {admins.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No administrators found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.name}</TableCell>
                  <TableCell className="font-mono text-xs">{formatAddress(admin.address)}</TableCell>
                  <TableCell>{admin.role}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {admin.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteConfirm(admin.id)}
                        className="text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 删除确认对话框 */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this administrator? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 