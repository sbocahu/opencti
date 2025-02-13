import { filesListing, loadFile } from '../database/file-storage';
import {
  askJobImport,
  deleteImport,
  filesMetrics,
  indexedFilesMetrics,
  resetFileIndexing,
  searchIndexedFiles,
  uploadImport,
  uploadPending
} from '../domain/file';
import { worksForSource } from '../domain/work';
import { batchLoader } from '../database/middleware';
import { batchCreator } from '../domain/user';
import { batchStixDomainObjects } from '../domain/stixDomainObject';

const creatorLoader = batchLoader(batchCreator);
const domainLoader = batchLoader(batchStixDomainObjects);

const fileResolvers = {
  Query: {
    file: (_, { id }, context) => loadFile(context.user, id),
    importFiles: (_, { first }, context) => filesListing(context, context.user, first, 'import/global/'),
    pendingFiles: (_, { first }, context) => filesListing(context, context.user, first, 'import/pending/'),
    filesMetrics: (_, args, context) => filesMetrics(context, context.user, args),
    indexedFilesMetrics: () => indexedFilesMetrics(),
    indexedFiles: (_, args, context) => searchIndexedFiles(context, context.user, args),
  },
  IndexedFile: {
    entity: (file, _, context) => domainLoader.load(file.entity_id, context, context.user),
  },
  File: {
    works: (file, _, context) => worksForSource(context, context.user, file.id),
  },
  FileMetadata: {
    entity: (metadata, _, context) => domainLoader.load(metadata.entity_id, context, context.user),
    creator: (metadata, _, context) => creatorLoader.load(metadata.creator_id, context, context.user),
  },
  Mutation: {
    uploadImport: (_, { file }, context) => uploadImport(context, context.user, file),
    uploadPending: (_, { file, entityId, labels, errorOnExisting }, context) => {
      return uploadPending(context, context.user, file, entityId, labels, errorOnExisting);
    },
    deleteImport: (_, { fileName }, context) => deleteImport(context, context.user, fileName),
    askJobImport: (_, args, context) => askJobImport(context, context.user, args),
    resetFileIndexing: (_, __, context) => resetFileIndexing(context, context.user),
  },
};

export default fileResolvers;
