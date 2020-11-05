"""
Singleton types for choosing the grid overflow rule used in
[`inbounds`](@ref) and [`NeighborhoodRule`](@ref) buffers. 
These determine what is done when a neighborhood or jump extends outside of the grid.
"""
abstract type Overflow end

"""
    WrapOverflow()

Wrap cordinates that overflow boundaries back to the opposite side of the grid.
"""
struct WrapOverflow <: Overflow end

"""
    RemoveOverflow()

Remove coordinates that overflow grid boundaries.
"""
struct RemoveOverflow <: Overflow end

"""
    WallOverflow()

    Wrap coordinates that overflow boundaries back to the closest cell within the grid.
"""
struct WallOverflow <: Overflow end

"""
Performance optimisations to use in the simulation.
"""
abstract type PerformanceOpt end

"""
    SparseOpt()

An optimisation that ignores all zero values in the grid.

For low-density simulations performance may improve by
orders of magnitude, as only used cells are run.

This is complicated for optimising neighborhoods - they
must run if they contain just one non-zero cell.

This is best demonstrated with this simulation, where the grey areas do not 
run except where the neighborhood partially hangs over an area that is not grey.

![SparseOpt demonstration](https://raw.githubusercontent.com/cesaraustralia/DynamicGrids.jl/media/complexlife_spareseopt.gif)
"""
struct SparseOpt <: PerformanceOpt end

"""
    NoOpt()

Run the simulation without performance optimisations
besides basic high performance programming.

This is still very fast, but not intelligent about the work
that it does.
"""
struct NoOpt <: PerformanceOpt end


abstract type AbstractRuleset end

# Getters
ruleset(rs::AbstractRuleset) = rs
rules(rs::AbstractRuleset) = rs.rules
overflow(rs::AbstractRuleset) = rs.overflow
opt(rs::AbstractRuleset) = rs.opt
cellsize(rs::AbstractRuleset) = rs.cellsize
timestep(rs::AbstractRuleset) = rs.timestep

Base.step(rs::AbstractRuleset) = timestep(rs)

"""
    Ruleset(rules...; overflow=RemoveOverflow(), opt=NoOpt(), cellsize=1, timestep=nothing)

A container for holding a sequence of `Rule`s and simulation 
details like overflow handing and optimisation.  
Rules will be run in the order they are passed, ie. `Ruleset(rule1, rule2, rule3)`.

## Keyword Arguments
- `opt`: a [`PerformanceOpt`](@ref) to specificy optimisations like 
  [`SparseOpt`](@ref). Defaults to [`NoOpt`](@ref).
- `overflow`: what to do with overflow of grid edges. 
  Options are `RemoveOverflow()`, `WrapOverflow()` or `WallOverflow()`, defaulting to [`RemoveOverflow`](@ref).
- `cellsize`: size of cells.
- `timestep`: fixed timestep where this is reuired for some rules. 
  eg. `Month(1)` or `1u"s"`.
"""
@default_kw @flattenable mutable struct Ruleset{O<:Overflow,Op<:PerformanceOpt,C,T} <: AbstractRuleset
    # Rules are intentionally not type stable. This allows `precalc` and Interact.jl 
    # updates to change the rule type. Function barriers remove most performance overheads.
    rules::Tuple{Vararg{<:Rule}} | ()               | true
    overflow::O                  | RemoveOverflow() | false
    opt::Op                      | NoOpt()          | false
    cellsize::C                  | 1                | false
    timestep::T                  | nothing          | false
end
Ruleset(rules::Vararg{<:Rule}; kwargs...) = Ruleset(; rules=rules, kwargs...)
Ruleset(rules::Tuple; kwargs...) = Ruleset(; rules=rules, kwargs...)
Ruleset(rs::Ruleset) = Ruleset(rules(rs), overflow(rs), opt(rs), cellsize(rs), timestep(rs))

Base.copy(rs::Ruleset) = 
    Ruleset(rules(rs), overflow(rs), opt(rs), cellsize(rs), timestep(rs)) 
