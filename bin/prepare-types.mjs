import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname( fileURLToPath( import.meta.url ) );
const typeDestination = path.resolve( dirname, '../src/types' );

const importFromRegex = /import\s(.+)\sfrom\s['"](.+)['"]/g;
const importNoneRegex = /import\s['"](.+)['"]/g;
const exportFromRegex = /export\s(.+)\sfrom\s['"](.+)['"]/g;

function resolveModule( currentPath, modulePath ) {
  if ( !modulePath.startsWith( '.' ) ) {
    return modulePath;
  }

  return path.join( currentPath, '..', modulePath ).replaceAll( '\\', '/' );
}

function replaceImports( content, currentPath ) {
  content = content.replaceAll( importFromRegex, ( _, stuff, modulePath ) => {
    const newModulePath = resolveModule( currentPath, modulePath );
    return `import ${ stuff } from '${ newModulePath }'`;
  } );

  content = content.replaceAll( importNoneRegex, ( _, modulePath ) => {
    const newModulePath = resolveModule( currentPath, modulePath );
    return `import '${ newModulePath }'`;
  } );

  content = content.replaceAll( exportFromRegex, ( _, stuff, modulePath ) => {
    const newModulePath = resolveModule( currentPath, modulePath );
    return `export ${ stuff } from '${ newModulePath }'`;
  } );

  return content;
}

function encloseWithModuleDeclaration( content, modulePath ) {
  return `declare module '${ modulePath }' {\n${ content }\n}`;
}

async function readdirRecursive( dir ) {
  const files = [];

  const entities = await fs.promises.readdir( dir );
  await Promise.all( entities.map( async ( name ) => {
    const entityPath = path.resolve( dir, name );
    const stat = await fs.promises.stat( entityPath );
    if ( stat.isDirectory() ) {
      files.push( ...await readdirRecursive( entityPath ) );
    } else {
      files.push( entityPath );
    }
  } ) );

  return files;
}

async function buildTypes( moduleName, rootPath, srcDir ) {
  // list all .d.ts files in the src dir
  const dtsFiles = ( await readdirRecursive( srcDir ) )
    .filter( ( name ) => name.endsWith( '.d.ts' ) );

  // modify dts files for monaco editor + create a map file
  const mapEntryLines = await Promise.all(
    dtsFiles.map( async ( srcPath ) => {
      const relativePath = path.relative( srcDir, srcPath );
      const relativePathFwSlash = relativePath.replaceAll( '\\', '/' );
      const relativePathFwSlashWoExt = relativePathFwSlash.match( /(.+)\.d\.ts/ )[ 1 ];

      let data = await fs.promises.readFile( srcPath, { encoding: 'utf8' } );

      const currentPath = `${ moduleName }/${ relativePathFwSlashWoExt }`;
      const modulePath = relativePathFwSlash === rootPath
        ? moduleName
        : currentPath.replace( /\/index$/, '' );

      data = replaceImports( data, currentPath );
      data = encloseWithModuleDeclaration( data, modulePath );

      await fse.outputFile(
        path.resolve( typeDestination, moduleName, relativePath ),
        data,
        { encoding: 'utf8' },
      );

      const mapKey = `'${ moduleName }/${ relativePathFwSlash }'`;
      const mapValueModule = `./${ moduleName }/${ relativePathFwSlash }?raw`;
      const mapValue = `import( '${ mapValueModule }' )`;

      return `  [ ${ mapKey }, ${ mapValue } ],`;
    } )
  );

  return mapEntryLines;
}

( async () => {
  // clean the previous export
  // protip: fs-extra's remove does nothing if the directory does not exist
  await fse.remove( typeDestination );

  // build types
  const moduleEntries = [
    [ '@pixiv/three-vrm', 'index.d.ts', path.resolve( dirname, '../node_modules/@pixiv/three-vrm/types' ) ],
    [ '@pixiv/three-vrm-core', 'index.d.ts', path.resolve( dirname, '../node_modules/@pixiv/three-vrm-core/types' ) ],
    [ '@pixiv/three-vrm-materials-hdr-emissive-multiplier', 'index.d.ts', path.resolve( dirname, '../node_modules/@pixiv/three-vrm-materials-hdr-emissive-multiplier/types' ) ],
    [ '@pixiv/three-vrm-materials-mtoon', 'index.d.ts', path.resolve( dirname, '../node_modules/@pixiv/three-vrm-materials-mtoon/types' ) ],
    [ '@pixiv/three-vrm-materials-v0compat', 'index.d.ts', path.resolve( dirname, '../node_modules/@pixiv/three-vrm-materials-v0compat/types' ) ],
    [ '@pixiv/three-vrm-node-constraint', 'index.d.ts', path.resolve( dirname, '../node_modules/@pixiv/three-vrm-node-constraint/types' ) ],
    [ '@pixiv/three-vrm-springbone', 'index.d.ts', path.resolve( dirname, '../node_modules/@pixiv/three-vrm-springbone/types' ) ],
    [ '@pixiv/types-vrm-0.0', 'index.d.ts', path.resolve( dirname, '../node_modules/@pixiv/types-vrm-0.0/types' ) ],
    [ '@pixiv/types-vrmc-materials-hdr-emissive-multiplier-1.0', 'index.d.ts', path.resolve( dirname, '../node_modules/@pixiv/types-vrmc-materials-hdr-emissive-multiplier-1.0/types' ) ],
    [ '@pixiv/types-vrmc-materials-mtoon-1.0', 'index.d.ts', path.resolve( dirname, '../node_modules/@pixiv/types-vrmc-materials-mtoon-1.0/types' ) ],
    [ '@pixiv/types-vrmc-node-constraint-1.0', 'index.d.ts', path.resolve( dirname, '../node_modules/@pixiv/types-vrmc-node-constraint-1.0/types' ) ],
    [ '@pixiv/types-vrmc-springbone-1.0', 'index.d.ts', path.resolve( dirname, '../node_modules/@pixiv/types-vrmc-springbone-1.0/types' ) ],
    [ '@pixiv/types-vrmc-vrm-1.0', 'index.d.ts', path.resolve( dirname, '../node_modules/@pixiv/types-vrmc-vrm-1.0/types' ) ],
    [ 'camera-controls', 'index.d.ts', path.resolve( dirname, '../node_modules/camera-controls/dist' ) ],
    [ 'lil-gui', 'lil-gui.esm.d.ts', path.resolve( dirname, '../node_modules/lil-gui/dist' ) ],
    [ 'three', 'index.d.ts', path.resolve( dirname, '../node_modules/@types/three' ) ],
  ];
  const mapEntryLines = ( await Promise.all(
    moduleEntries.map( async ( [ moduleName, rootPath, srcDir ] ) => {
      return await buildTypes( moduleName, rootPath, srcDir );
    } )
  ) ).flat();

  const mapFileContent = [
    'export default new Map( [',
    ...mapEntryLines,
    '] );',
    ''
  ].join( '\n' );

  await fse.outputFile(
    path.resolve( typeDestination, 'dts-list.ts' ),
    mapFileContent,
    { encoding: 'utf8' },
  );
} )();
