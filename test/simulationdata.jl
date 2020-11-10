using DynamicGrids, OffsetArrays, Test, Dates
using DynamicGrids: initdata!, data, init, mask, radius, overflow, source, 
    dest, sourcestatus, deststatus, localstatus, gridsize,
    ruleset, grids, currentframe, grids, SimData, Extent,
    updatetime, ismasked, currenttimestep, WritableGridData, tspan

inita = [0 1 1
         0 1 1]
initb = [2 2 2
         2 2 2]
initab = (a=inita, b=initb)

life = Life{:a,:a}()
rs = Ruleset(life, timestep=Day(1));
tspan_ = DateTime(2001):Day(1):DateTime(2001, 2)

@testset "initdata!" begin

    extent = Extent(; init=initab, tspan=tspan_)
    simdata = initdata!(nothing, extent, rs, nothing)
    @test simdata isa SimData
    @test init(simdata) == initab
    @test ruleset(simdata) === rs
    @test tspan(simdata) === tspan_
    @test currentframe(simdata) === 1
    @test first(simdata) === simdata[:a]
    @test last(simdata) === simdata[:b]
    @test overflow(simdata) === RemoveOverflow()
    @test gridsize(simdata) == (2, 3)
    updated = updatetime(simdata, 2)
    @test currenttimestep(simdata) == Millisecond(86400000)

    gs = grids(simdata)
    grida = gs[:a]
    gridb = gs[:b]

    @test parent(source(grida)) == parent(dest(grida)) ==
        [0 0 0 0 0
         0 0 1 1 0
         0 0 1 1 0
         0 0 0 0 0]

    wgrida = WritableGridData(grida)
    @test parent(grida) == parent(source(grida)) == parent(source(wgrida))
    @test parent(wgrida) === parent(dest(grida)) === parent(dest(wgrida))

    @test sourcestatus(grida) == deststatus(grida) == 
        [0 1 0 0
         0 1 0 0
         0 0 0 0]

    @test parent(source(gridb)) == parent(dest(gridb)) == 
        [2 2 2
         2 2 2]
    @test sourcestatus(gridb) == deststatus(gridb) == true

    @test firstindex(grida) == 1
    @test lastindex(grida) == 20
    @test size(grida) == (4, 5)
    @test axes(grida) == (0:3, 0:4)
    @test ndims(grida) == 2
    @test eltype(grida) == Int
    @test ismasked(grida, 1, 1) == false

    extent = Extent(; init=initab, tspan=tspan_)
    initdata!(simdata, extent, rs, nothing)
end

@testset "initdata! with :_default_" begin
    initx = [1 0]
    rs = Ruleset(Life())
    extent = Extent(; init=(_default_=initx,), tspan=tspan_)
    simdata = initdata!(nothing, extent, rs, nothing)
    simdata2 = initdata!(simdata, extent, rs, nothing)
    @test keys(simdata2) == (:_default_,)
    @test DynamicGrids.ruleset(simdata2) === rs
    @test DynamicGrids.init(simdata2[:_default_]) == [1 0]
    @test DynamicGrids.source(simdata2[:_default_]) == 
        OffsetArray([0 0 0 0
                     0 1 0 0
                     0 0 0 0], (0:2, 0:3))
end

@testset "initdata! with replicates" begin
    nreps = 2
    extent = Extent(; init=initab, tspan=tspan_)
    simdata = initdata!(nothing, extent, rs, nreps)
    @test simdata isa Vector{<:SimData}
    @test all(DynamicGrids.ruleset.(simdata) .== Ref(rs))
    @test all(map(tspan, simdata) .== Ref(tspan_))
    @test all(keys.(DynamicGrids.grids.(simdata)) .== Ref(keys(initab)))
    simdata2 = initdata!(simdata, extent, rs, nreps)
end

# TODO more comprehensively unit test? a lot of this is
# relying on integration testing.
