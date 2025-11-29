import { Permission } from '@affine/graphql';
import { useI18n } from '@affine/i18n';
import { cssVar } from '@toeverything/theme';

import Input from '../../../ui/input';
import { Menu, MenuItem, MenuTrigger } from '../../../ui/menu';
import * as styles from './styles.css';

export const EmailInvite = ({
  inviteEmail,
  setInviteEmail,
  handleConfirm,
  importCSV,
  isMutating,
  isValidEmail,
  selectedRole,
  onRoleChange,
}: {
  inviteEmail: string;
  setInviteEmail: (value: string) => void;
  handleConfirm: () => void;
  isMutating: boolean;
  isValidEmail: boolean;
  importCSV: React.ReactNode;
  selectedRole: Permission;
  onRoleChange: (role: Permission) => void;
}) => {
  const t = useI18n();

  const getRoleName = (role: Permission) => {
    switch (role) {
      case Permission.Admin:
        return t['com.affine.payment.member.team.member-role.admin']();
      case Permission.Collaborator:
        return t['com.affine.payment.member.team.member-role.collaborator']();
      case Permission.NoAccess:
        return 'Restricted Access';
      default:
        return t['com.affine.payment.member.team.member-role.collaborator']();
    }
  };

  const roleMenuItems = (
    <>
      <MenuItem onSelect={() => onRoleChange(Permission.Admin)}>
        {t['com.affine.payment.member.team.member-role.admin']()}
      </MenuItem>
      <MenuItem onSelect={() => onRoleChange(Permission.Collaborator)}>
        {t['com.affine.payment.member.team.member-role.collaborator']()}
      </MenuItem>
      <MenuItem onSelect={() => onRoleChange(Permission.NoAccess)}>
        No Access
      </MenuItem>
    </>
  );

  return (
    <>
      <div className={styles.modalSubTitle}>
        {t['com.affine.payment.member.team.invite.email-invite']()}
      </div>
      <div>
        <Input
          inputStyle={{ fontSize: cssVar('fontXs') }}
          disabled={isMutating}
          placeholder={t[
            'com.affine.payment.member.team.invite.email-placeholder'
          ]()}
          value={inviteEmail}
          onChange={setInviteEmail}
          onEnter={handleConfirm}
          size="large"
        />
        {!isValidEmail ? (
          <div className={styles.errorHint}>
            {t['com.affine.auth.sign.email.error']()}
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: '12px' }}>
        <div style={{ fontSize: '14px', marginBottom: '8px' }}>
          {t['com.affine.payment.member.team.member-role']()}
        </div>
        <Menu items={roleMenuItems}>
          <MenuTrigger block={true}>{getRoleName(selectedRole)}</MenuTrigger>
        </Menu>
      </div>

      <div>{importCSV}</div>
    </>
  );
};
