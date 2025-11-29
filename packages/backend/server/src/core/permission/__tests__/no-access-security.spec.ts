import test from 'ava';

import { createTestingModule, TestingModule } from '../../../__tests__/utils';
import {
  Models,
  User,
  Workspace,
  WorkspaceMemberStatus,
  WorkspaceRole,
} from '../../../models';
import { PermissionModule } from '..';
import { DocAccessController } from '../doc';
import { DocRole } from '../types';

let module: TestingModule;
let models: Models;
let docController: DocAccessController;
let owner: User;
let noAccessUser: User;
let workspace: Workspace;

test.before(async () => {
  module = await createTestingModule({ imports: [PermissionModule] });
  models = module.get<Models>(Models);
  docController = new DocAccessController();
});

test.beforeEach(async () => {
  await module.initTestingDB();

  // Create test users
  owner = await models.user.create({ email: 'owner@affine.pro' });
  noAccessUser = await models.user.create({ email: 'noaccess@affine.pro' });

  // Create workspace
  workspace = await models.workspace.create(owner.id);

  // Add NoAccess user to workspace
  await models.workspaceUser.set(
    workspace.id,
    noAccessUser.id,
    WorkspaceRole.NoAccess,
    {
      status: WorkspaceMemberStatus.Accepted,
    }
  );
});

test.after.always(async () => {
  await module.close();
});

test('NoAccess user can access documents when explicitly granted', async t => {
  // Grant document access to NoAccess user
  await models.docUser.set(
    workspace.id,
    'test-doc',
    noAccessUser.id,
    DocRole.Reader
  );

  const role = await docController.getRole({
    workspaceId: workspace.id,
    docId: 'test-doc',
    userId: noAccessUser.id,
  });

  // Should have Reader access to the document
  t.is(role, DocRole.Reader);
});

test('NoAccess user cannot access documents without explicit grants', async t => {
  // Should have no access to document without explicit grant
  const role = await docController.getRole({
    workspaceId: workspace.id,
    docId: 'private-doc',
    userId: noAccessUser.id,
  });

  t.is(role, null);
});

test('NoAccess role does not auto-elevate document permissions', async t => {
  // Grant External role to document (minimal access)
  await models.docUser.set(
    workspace.id,
    'limited-doc',
    noAccessUser.id,
    DocRole.External
  );

  const role = await docController.getRole({
    workspaceId: workspace.id,
    docId: 'limited-doc',
    userId: noAccessUser.id,
  });

  // Should stay External, not auto-elevated like Admin/Owner would do
  t.is(role, DocRole.External);
});

test('NoAccess user with high document role keeps that role', async t => {
  // Grant Manager role to document
  await models.docUser.set(
    workspace.id,
    'managed-doc',
    noAccessUser.id,
    DocRole.Manager
  );

  const role = await docController.getRole({
    workspaceId: workspace.id,
    docId: 'managed-doc',
    userId: noAccessUser.id,
  });

  // Should have Manager access to the document
  t.is(role, DocRole.Manager);
});

test('Role transition from NoAccess preserves document permissions', async t => {
  // Grant document access while user is NoAccess
  await models.docUser.set(
    workspace.id,
    'transition-doc',
    noAccessUser.id,
    DocRole.Editor
  );

  // Verify access works
  let role = await docController.getRole({
    workspaceId: workspace.id,
    docId: 'transition-doc',
    userId: noAccessUser.id,
  });
  t.is(role, DocRole.Editor);

  // Change user to Collaborator
  await models.workspaceUser.set(
    workspace.id,
    noAccessUser.id,
    WorkspaceRole.Collaborator,
    {
      status: WorkspaceMemberStatus.Accepted,
    }
  );

  // Document permissions should be preserved
  role = await docController.getRole({
    workspaceId: workspace.id,
    docId: 'transition-doc',
    userId: noAccessUser.id,
  });
  t.is(role, DocRole.Editor);
});

test('NoAccess user cannot access workspace metadata document', async t => {
  // Test accessing the workspace metadata document (where docId === workspaceId)
  const role = await docController.getRole({
    workspaceId: workspace.id,
    docId: workspace.id, // This is the workspace metadata document
    userId: noAccessUser.id,
  });

  // Should have no access to the workspace metadata document
  t.is(
    role,
    null,
    'NoAccess user should not have access to workspace metadata document'
  );
});

test('NoAccess user cannot access workspace metadata document', async t => {
  // Test accessing the workspace metadata document (where docId === workspaceId)
  const role = await docController.getRole({
    workspaceId: workspace.id,
    docId: workspace.id, // This is the workspace metadata document
    userId: noAccessUser.id,
  });

  // Should have no access to the workspace metadata document
  t.is(
    role,
    null,
    'NoAccess user should not have access to workspace metadata document'
  );
});
