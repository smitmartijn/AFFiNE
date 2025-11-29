import test from 'ava';

import {
  Action,
  DOC_ACTION_TO_MINIMAL_ROLE_MAP,
  DocRole,
  fixupDocRole,
  mapDocRoleToPermissions,
  mapWorkspaceRoleToPermissions,
  WORKSPACE_ACTION_TO_MINIMAL_ROLE_MAP,
  WorkspaceRole,
} from '../types';

test('should be able to get the correct action path', t => {
  t.is(Action.Workspace.CreateDoc, 'Workspace.CreateDoc');
  t.is(Action.Workspace.Users.Read, 'Workspace.Users.Read');
  t.is(Action.Doc.Copy, 'Doc.Copy');
  t.is(Action.Doc.Users.Manage, 'Doc.Users.Manage');

  t.not(Action.Workspace.Delete, 'Wrong.Action.Name');

  function test(_action: Action) {}
  // Action visitor result can be passed to function that accepts [ActionName]
  test(Action.Workspace.CreateDoc);
  // @ts-expect-error make sure type checked
  test('Wrong.Action.Name');
});

const workspaceRoles = Object.values(WorkspaceRole).filter(
  r => typeof r === 'number'
) as WorkspaceRole[];
const docRoles = Object.values(DocRole).filter(
  r => typeof r === 'number'
) as DocRole[];

test(`should be able to fixup doc role from workspace role and doc role`, t => {
  for (const workspaceRole of workspaceRoles) {
    for (const docRole of docRoles) {
      const fixedDocRole = fixupDocRole(workspaceRole, docRole);
      t.snapshot(
        fixedDocRole === null ? null : DocRole[fixedDocRole],
        `WorkspaceRole: ${WorkspaceRole[workspaceRole]}, DocRole: ${DocRole[docRole]}`
      );
    }
  }
});

test(`should be able to get correct permissions from WorkspaceRole`, t => {
  for (const workspaceRole of workspaceRoles) {
    t.snapshot(
      mapWorkspaceRoleToPermissions(workspaceRole),
      `WorkspaceRole: ${WorkspaceRole[workspaceRole]}`
    );
  }
});

test(`should be able to get correct permissions from DocRole`, t => {
  for (const docRole of docRoles) {
    t.snapshot(
      mapDocRoleToPermissions(docRole),
      `DocRole: ${DocRole[docRole]}`
    );
  }
});

test('should be able to find minimal workspace role from action', t => {
  t.snapshot(
    Object.fromEntries(
      Array.from(WORKSPACE_ACTION_TO_MINIMAL_ROLE_MAP.entries()).map(
        ([action, role]) => [action, WorkspaceRole[role]]
      )
    )
  );
});

test('should be able to find minimal doc role from action', t => {
  t.snapshot(
    Object.fromEntries(
      Array.from(DOC_ACTION_TO_MINIMAL_ROLE_MAP.entries()).map(
        ([action, role]) => [action, DocRole[role]]
      )
    )
  );
});

test('NoAccess role should have minimal workspace permissions', t => {
  const permissions = mapWorkspaceRoleToPermissions(WorkspaceRole.NoAccess);

  // NoAccess users should be able to access workspace and sync for collaboration
  t.true(permissions['Workspace.Read'], 'NoAccess should allow workspace read');
  t.true(
    permissions['Workspace.Properties.Read'],
    'NoAccess should allow properties read'
  );
  t.true(
    permissions['Workspace.Sync'],
    'NoAccess should allow sync for real-time collaboration'
  );

  // But should NOT have access to workspace content organization or blobs
  t.falsy(
    permissions['Workspace.Organize.Read'],
    'NoAccess should NOT allow organize read'
  );
  t.falsy(
    permissions['Workspace.Blobs.Read'],
    'NoAccess should NOT allow blob access'
  );
});

test('NoAccess role should not grant elevated doc permissions', t => {
  // NoAccess users should only get what's explicitly granted
  t.is(fixupDocRole(WorkspaceRole.NoAccess, DocRole.None), null);
  t.is(fixupDocRole(WorkspaceRole.NoAccess, DocRole.Reader), DocRole.Reader);
  t.is(fixupDocRole(WorkspaceRole.NoAccess, DocRole.Manager), DocRole.Manager);
  // Should not auto-elevate like Admin/Owner roles do
  t.not(fixupDocRole(WorkspaceRole.NoAccess, DocRole.External), DocRole.Owner);
});

test('NoAccess role should be lowest in hierarchy', t => {
  const roles = [
    WorkspaceRole.NoAccess,
    WorkspaceRole.External,
    WorkspaceRole.Collaborator,
    WorkspaceRole.Admin,
    WorkspaceRole.Owner,
  ];
  const sortedRoles = [...roles].sort((a, b) => a - b);
  t.is(
    sortedRoles[0],
    WorkspaceRole.NoAccess,
    'NoAccess should be the lowest role value'
  );
});

test('NoAccess with DocRole combinations', t => {
  // Test that NoAccess doesn't auto-elevate document permissions
  t.is(
    fixupDocRole(WorkspaceRole.NoAccess, DocRole.External),
    DocRole.External
  );
  t.is(fixupDocRole(WorkspaceRole.NoAccess, DocRole.Reader), DocRole.Reader);
  t.is(fixupDocRole(WorkspaceRole.NoAccess, DocRole.Manager), DocRole.Manager);
  t.is(fixupDocRole(WorkspaceRole.NoAccess, DocRole.Owner), DocRole.Owner);

  // NoAccess + None should return null (no access)
  t.is(fixupDocRole(WorkspaceRole.NoAccess, DocRole.None), null);

  // Compare with other roles that do auto-elevate
  t.is(fixupDocRole(WorkspaceRole.Owner, DocRole.External), DocRole.Owner); // Owner auto-elevates
  t.is(
    fixupDocRole(WorkspaceRole.NoAccess, DocRole.External),
    DocRole.External
  ); // NoAccess does not
});
