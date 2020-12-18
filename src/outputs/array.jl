"""
    ArrayOutput(init; tspan::AbstractRange) 

A simple output that stores each step of the simulation in a vector of arrays.

## Arguments:
- `init`: initialisation `Array` or `NamedTuple` of `Array`

## Keyword Argument:
- `tspan`: `AbstractRange` timespan for the simulation
"""
mutable struct ArrayOutput{T,F<:AbstractVector{T},E} <: Output{T,F} 
    frames::F
    running::Bool
    extent::E
end
function ArrayOutput(; frames, running, extent, kwargs...)
    append!(frames, _zerogrids(init(extent), length(tspan(extent))-1))
    ArrayOutput(frames, running, extent)
end

"""
    ResultOutput(init; tspan::AbstractRange) 

A simple output that only stores the final result, not intermediate frames.

## Arguments:
- `init`: initialisation `Array` or `NamedTuple` of `Array`

## Keyword Argument:
- `tspan`: `AbstractRange` timespan for the simulation
"""
mutable struct ResultOutput{T,F<:AbstractVector{T},E} <: Output{T,F} 
    frames::F
    running::Bool
    extent::E
end
ResultOutput(; frames, running, extent, kwargs...) = ResultOutput(frames, running, extent)

isstored(o::ResultOutput) = false
storeframe!(output::ResultOutput, data::AbstractSimData) = nothing

function finalise!(output::ResultOutput, data::AbstractSimData) 
    _storeframe!(eltype(output), output, data)
end
