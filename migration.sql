-- AlterTable
ALTER TABLE `tbl_session_renewal` MODIFY `skater_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `tbl_session_renewal` ADD CONSTRAINT `tbl_session_renewal_skater_id_fkey` FOREIGN KEY (`skater_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_session_renewal` ADD CONSTRAINT `tbl_session_renewal_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `tbl_session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permission` ADD CONSTRAINT `permission_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `permission_modules`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_privileges` ADD CONSTRAINT `staff_privileges_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_privileges` ADD CONSTRAINT `staff_privileges_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_user` ADD CONSTRAINT `tbl_user_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

