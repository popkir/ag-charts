import gzip, hashlib, json, math, pathlib, statistics, struct, zipfile

OUT = pathlib.Path('artifacts/stacked-series/total-render-final')
SOURCES = {'base':'fd652e876a2b059924848a2177c82e67d6752327','head':'52f45beae1fd50b3a23b678219f5d1b81ffea509'}
TREES = {'base':'2d0c9d919d49d37a524e423244063d34fbf8e347','head':'c72fed50b4964896611eed6a69fb820e0efdf15e'}
HELPER = 'c83ab6ebdb18ffcd44d13c5550cf7bd7f1d782f2'
sha = lambda b: hashlib.sha256(b).hexdigest()
canonical = lambda obj: json.dumps(obj, separators=(',',':'), ensure_ascii=False, allow_nan=False).encode()

def save(name, obj):
    (OUT/name).write_text(json.dumps(obj,indent=2)+'\n')

manifest = json.loads((OUT/'manifest.json').read_text())
assert manifest['helperCommit'] == HELPER and manifest['runConclusion'] == 'success'
archive_audit=[]
for entry in manifest['files']:
    data=(OUT/entry['file']).read_bytes()
    assert len(data)==entry['bytes'] and sha(data)==entry['sha256']
    if entry.get('githubDigest'): assert entry['githubDigest']=='sha256:'+sha(data)
    if entry['file'].endswith('.zip'):
        with zipfile.ZipFile(OUT/entry['file']) as z: assert z.testzip() is None
        archive_audit.append({'file':entry['file'],'bytes':len(data),'sha256':sha(data),'githubDigestVerified':bool(entry.get('githubDigest')),'crcVerified':True})
builds={}
for role in SOURCES:
    with zipfile.ZipFile(OUT/f'stacked-total-build-{role}.zip') as z:
        receipt=json.loads(z.read('build.json'))
        assert receipt['source']==SOURCES[role] and receipt['tree']==TREES[role]
        assert receipt['trackedRuntimeDiff']==''
        bundle=z.read('ag-charts-enterprise.js')
        assert receipt['bundleSha256']==sha(bundle) and receipt['bundleBytes']==len(bundle)
        assert receipt['buildCommand']=='yarn nx build:umd ag-charts-enterprise --skip-nx-cache'
        assert z.read('build.log')
        builds[role]=receipt
run=json.loads((OUT/'run.json').read_text())
jobs=json.loads((OUT/'jobs.json').read_text())['jobs']
assert run['head_sha']==HELPER and run['conclusion']=='success'
assert len(jobs)==3 and all(j['conclusion']=='success' for j in jobs)
compare_job=next(j for j in jobs if j['name']=='compare')
records=[]
checks=[]
reference=None
categories=['M'+str(i+1) for i in range(12)]
with zipfile.ZipFile(OUT/'stacked-total-render-results.zip') as z:
    original_summary=json.loads(z.read('summary.json'))
    for pair in range(1,4):
        for role in ['base','head']:
            stem=f'run{pair}-{role}'
            r=json.loads(z.read(stem+'.json'))
            assert r['source']==SOURCES[role] and r['build']['source']==SOURCES[role]
            assert r['build']['runtimeBuild']==builds[role]
            assert r['seriesCount']==7293 and r['categories']==12 and r['expectedPoints']==87516
            assert r['configured']['series']==7293 and r['configured']['rows']==12
            assert r['configured']['yKeys']==['y'+str(i) for i in range(7293)]
            assert r['configured']['animation']['enabled'] is False and r['configured']['legend']['enabled'] is True
            assert r['configured']['width']==1200 and r['configured']['height']==800
            assert r['viewport']=={'width':1280,'height':960,'deviceScaleFactor':1}
            assert len(r['chartState']['legend'])==7293
            assert all(e['visible'] is True for e in r['chartState']['legend'])
            assert [e['itemId'] for e in r['chartState']['legend']]==['y'+str(i) for i in range(7293)]
            console=json.loads(z.read(stem+'.console.json'))
            assert console['pageErrors']==[]
            raw_input=gzip.decompress(z.read(stem+'.input.json.gz'))
            assert sha(raw_input)==r['inputSha256']
            inp=json.loads(raw_input)
            assert len(inp['data'])==12 and len(inp['series'])==7293
            assert inp['animation']=={'enabled':False} and inp['legend']=={'enabled':True}
            assert inp['width']==1200 and inp['height']==800
            for i,s in enumerate(inp['series']):
                assert s=={'type':'bar','direction':'vertical','xKey':'month','yKey':'y'+str(i),'yName':'Series '+str(i),'stacked':True}
            sums=[]
            for row_index,row in enumerate(inp['data']):
                assert row['month']==categories[row_index] and len(row)==7294
                values=[row['y'+str(i)] for i in range(7293)]
                assert values==[(i%97)+row_index+1 for i in range(7293)]
                sums.append(sum(values))
            assert sums==r['expectedCategoryStackTotals']
            raw_scene=gzip.decompress(z.read(stem+'.scene.json.gz'))
            assert sha(raw_scene)==r['sceneAudit']['sceneSha256']
            scenes=json.loads(raw_scene)
            assert len(scenes)==1 and len(scenes[0]['series'])==7293
            geometry=[]
            for series in scenes[0]['series']:
                stack=[series['content']]
                rects=[]
                while stack:
                    node=stack.pop()
                    if node.get('state',{}).get('type')=='rect' and node.get('datumId') in categories:
                        props=node['state']['props']
                        assert all(isinstance(props[k],(int,float)) and math.isfinite(props[k]) for k in ['x','y','width','height'])
                        assert props['width']>0 and props['height']>0
                        rects.append({'datumId':node['datumId'],'state':node['state']})
                    stack.extend(reversed(node.get('children',[])))
                assert len(rects)==12 and set(r['datumId'] for r in rects)==set(categories)
                geometry.append(sorted(rects,key=lambda r:categories.index(r['datumId'])))
            geometry_hash=sha(canonical(geometry))
            png=z.read(stem+'.png')
            assert png[:8]==b'\x89PNG\r\n\x1a\n'
            assert struct.unpack('>II',png[16:24])==(1200,800)
            assert sha(png)==r['screenshot']['sha256']
            state_hash=sha(canonical(r['chartState']))
            equality={'input':sha(raw_input),'scene':sha(raw_scene),'geometryPythonCanonical':geometry_hash,'png':sha(png),'publicStatePythonCanonical':state_hash}
            if reference is None: reference=equality
            assert equality==reference, stem
            assert r['benchmark']['results'][0]['sampleCount']==1 and len(r['benchmark']['results'])==1
            assert all(math.isfinite(r['timings'][key]) and r['timings'][key]>0 for key in ['updateCompleteMs','twoFramesCompleteMs'])
            assert r['timings']['twoFramesCompleteMs']>=r['timings']['updateCompleteMs']
            checks.append({'record':stem,'source':r['source'],'actualSeries':7293,'actualPositiveDatumRectangles':87516,'enabledLegendRecords':7293,'inputValuesVerified':87516,'hashes':equality,'browserExceptions':0})
            records.append(r)
            print('Audited',stem,r['timings'],flush=True)
            del scenes,geometry,raw_scene,raw_input,inp
    for pair in range(1,4):
        comparison=json.loads(z.read(f'run{pair}-comparison.json'))
        assert comparison['differentPixels']==0
        for key in ['geometryIdentical','rawScenesIdentical','publicStateIdentical','pngBytesIdentical','inputIdentical']: assert comparison[key] is True
assert len({canonical(r['host']) for r in records})==1
assert len({r['browserVersion'] for r in records})==1
stats={}
for key in ['updateCompleteMs','twoFramesCompleteMs']:
    row={}
    for role in SOURCES:
        values=[r['timings'][key] for r in records if r['role']==role]
        row[role]={'valuesMs':values,'medianMs':statistics.median(values),'minMs':min(values),'maxMs':max(values)}
        assert row[role]['medianMs']==original_summary[role][key]['median']
    row['ratioOfMedians']=row['base']['medianMs']/row['head']['medianMs']
    row['elapsedReductionPercent']=(1-row['head']['medianMs']/row['base']['medianMs'])*100
    row['pairedRatios']=[b/h for b,h in zip(row['base']['valuesMs'],row['head']['valuesMs'])]
    row['pairedRatioMin']=min(row['pairedRatios']);row['pairedRatioMax']=max(row['pairedRatios'])
    stats[key]=row
assert stats['twoFramesCompleteMs']['ratioOfMedians']==original_summary['twoFramesRatio']
assert stats['updateCompleteMs']['ratioOfMedians']==original_summary['updateRatio']
summary={'repository':'popkir/ag-charts','runId':run['id'],'runUrl':run['html_url'],'helperCommit':HELPER,'sources':SOURCES,'sourceTrees':TREES,'builds':builds,'comparisonJob':{'id':compare_job['id'],'runnerId':compare_job['runner_id'],'runnerName':compare_job['runner_name'],'startedAt':compare_job['started_at'],'completedAt':compare_job['completed_at']},'host':records[0]['host'],'browserVersion':records[0]['browserVersion'],'workload':{'actualSeries':7293,'categories':12,'actualPositiveDatumRectangles':87516,'enabledLegendRecords':7293,'legendPagination':'normal; enabled records are not all drawn simultaneously on one page','animationEnabled':False,'chartWidth':1200,'chartHeight':800,'deviceScaleFactor':1},'methodology':{'repeatsPerSide':3,'pairOrders':[['base','head'],['head','base'],['base','head']],'browserProcess':'fresh per measurement','warmup':'separate 32-series chart, destroyed before timing; GC requested outside timing','primary':'AgCharts.create to public waitForUpdate plus two requestAnimationFrame callbacks','secondary':'unchanged upstream performInitialLoad: AgCharts.create to public waitForUpdate','canonicalInstrumentation':'no tracing, CPU profiler or heap sampling','renderer':'headless Chromium; --disable-gpu --use-gl=swiftshader','builds':'official pinned-source Nx UMD builds, without source/runtime instrumenting edits','ratios':'directly measured on one comparison VM; no multiplication of historical ratios'},'statistics':stats,'records':[{'label':r['label'],'role':r['role'],'source':r['source'],'timestamp':r['timestamp'],'timingsMs':r['timings'],'contention':r['contention']} for r in records],'equivalence':{'allSixRawInputsIdentical':True,'allSixRawScenesIdentical':True,'allSixPngBytesIdentical':True,'allSixPublicStatesIdentical':True,'independentlyParsedAllSixScenes':True,'independentlyCheckedEveryInputValue':True,'hashes':reference},'limitations':['Three samples per side on one VM are not a confidence interval or a hardware population estimate.','Synthetic positive initial render only; this run does not retest interactive semantics or all data/animation cases.','Headless software rendering; GPU contribution and real application time are not measured.','The archived HTML/CSS/capture scaffolding is reused; both installed runtime bundles are new official builds of the pinned source revisions.']}
save('summary.json',summary)
save('audit.json',{'status':'passed','runId':run['id'],'checkedArchives':archive_audit,'builds':builds,'records':checks,'statisticsRecomputed':True,'workflowIdentityVerified':True,'comparisonSingleJob':summary['comparisonJob'],'method':'Independent local Python recomputation from all six raw input/scene/PNG members; no reuse of reported aggregate timing results.'})
print(json.dumps({'statistics':stats,'host':summary['host'],'browserVersion':summary['browserVersion']},indent=2))
