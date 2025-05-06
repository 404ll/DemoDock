"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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

// 更新接口以匹配实际数据结构
interface SubAdminListProps {
  subAdmins: string[] // 直接使用地址数组
  onDeleteSubAdmin: (address: string) => void // 删除时传递地址
}

export function SubAdminList({ subAdmins, onDeleteSubAdmin }: SubAdminListProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteAddress, setDeleteAddress] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 打开删除确认对话框
  const handleDeleteConfirm = (address: string) => {
    setDeleteAddress(address)
    setIsDeleting(true)
  }

  // 执行删除操作
  const handleDelete = async () => {
    if (!deleteAddress) return
    setIsSubmitting(true)

    try {
      console.log("Deleting sub-admin:", deleteAddress)
      onDeleteSubAdmin(deleteAddress)
      setIsDeleting(false)
    } catch (error) {
      console.error("Error deleting sub-admin:", error)
      window.alert("Failed to delete sub-admin. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {subAdmins.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No sub-administrators found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subAdmins.map((address) => (
                <TableRow key={address}>
                  <TableCell className="font-mono">
                    {address}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteConfirm(address)}
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
              Are you sure you want to delete this sub-administrator? This action cannot be undone.
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
