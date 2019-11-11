var documenterSearchIndex = {"docs":
[{"location":"#DynamicGrids.jl-1","page":"DynamicGrids.jl","title":"DynamicGrids.jl","text":"","category":"section"},{"location":"#","page":"DynamicGrids.jl","title":"DynamicGrids.jl","text":"DynamicGrids","category":"page"},{"location":"#DynamicGrids","page":"DynamicGrids.jl","title":"DynamicGrids","text":"DynamicGrids\n\n(Image: ) (Image: ) (Image: Build Status)  (Image: Buildcellularautomatabase status) (Image: Coverage Status)  (Image: codecov.io)\n\nDynamicGrids is a generalised modular framework for cellular automata and similar grid-based spatial models. It is extended by Dispersal.jl for modelling organism dispersal processes.\n\nThe framework is highly customisable, but there are some central ideas that define how a simulation works: rules, init arrays and outputs.\n\nRules, and Interactions\n\nRules hold the parameters for running a simulation. Each rule triggers a specific applyrule method that operates on each of the cells in the grid. Rules come in a number of flavours (outlined in the docs), which allows assumptions to be made about running them that can greatly improve performance. Rules are joined in a Ruleset object and run in sequence:\n\nruleset = Ruleset(Life(2, 3))\n\nThe Rulset wrapper seems a little redundant here, but multiple models can be combined in a Ruleset. Each rule will be run for the whole grid, in sequence, using appropriate optimisations depending on the parent types of each rule:\n\nruleset = Ruleset(rule1, rule2)\n\nFor better performance (often ~2x), models included in a Chain object will be combined into a single model, using only one array read and write. This optimisation is limited to CellRule, or an NeighborhoodRule followed by CellRule. If the @inline compiler macro is used on all applyrule methods, all rules in a Chain will be compiled together with the looping code into a single, efficient function call.\n\nruleset = Ruleset(rule1, Chain(rule2, rule3))\n\nA MultiRuleset holds, as the name suggests, multiple rulesets. These may either run side by side independently (say for comparative analysis), or interact using Interaction rules. An Interaction is a rule that operates on multiple grids, linking multiple discrete Rulesets into a larger model, such as this hypothetical spatial predator/prey model:\n\nMuliRuleset(rules=(predator=predatordispersal, prey=Chain(popgrowth, preydispersal)),\n            interactions=(predation,))\n\nInit\n\nThe init array may be any AbstractArray, containing whatever initialisation data is required to start the simulation. The array type, size and element type of the init array determine the types used in the simulation, as well as providing the initial conditions:\n\ninit = rand(Float32, 100, 100)\n\nAn init array can be attached to a Ruleset: \n\nruleset = Ruleset(Life(); init=init)\n\nor passed into a simulation, where it will take preference over the Ruleset init:\n\nsim!(output, rulset; init=init)\n\nFor MultiRuleset, init is a NamedTuple of equal-sized arrays matching the names given to each Ruleset :\n\ninit = (predator=rand(100, 100), prey=(rand(100, 100))\n\nHandling and passing of the correct arrays is automated by DynamicGrids.jl. Interaction rules must specify which grids they require in what order.\n\nOutput\n\nOutputs are ways of storing or viewing a simulation. They can be used interchangeably depending on your needs: ArrayOutput is a simple storage structure for high performance-simulations. As with most outputs, it is initialised with the init array, but in this case it also requires the number of simulation frames to preallocate before the simulation runs.\n\noutput = ArrayOutput(init, 10)\n\nThe REPLOutput is a GraphicOutput that can be useful for checking a simulation when working in a terminal or over ssh:\n\noutput = REPLOutput(init)\n\nImageOutput is the most complex class of outputs, allowing full color visual simulations and even interactions. DynamicGridsInteract.jl provides simulation interfaces for use in Juno, Jupyter, web pages or electron apps, with live interactive control over parameters. DynamicGridsGtk.jl is a simple graphical output for Gtk. These packages are kept separate to avoid dependencies when being used in non-graphical simulations. \n\nOutputs are also easy to write, and high performance or applications may benefit from writing a custom output to reduce memory use, while custom frame processors can help developing specialised visualisations.\n\nSimulations\n\nA typical simulation is run with a script like:\n\ninit = my_array\nrules = Ruleset(Life(); init=init)\noutput = ArrayOutput(init, 10)\n\nsim!(output, rules)\n\n\n\n\n\n","category":"module"},{"location":"#Examples-1","page":"DynamicGrids.jl","title":"Examples","text":"","category":"section"},{"location":"#","page":"DynamicGrids.jl","title":"DynamicGrids.jl","text":"While this package isn't designed or optimised specifically to run the game of life, it's a simple example of what this package can do. This example runs a game of life and displays it in a REPLOutput.","category":"page"},{"location":"#","page":"DynamicGrids.jl","title":"DynamicGrids.jl","text":"using DynamicGrids\n\n# Build a random starting grid\ninit = round.(Int8, max.(0.0, rand(-2.0:0.1:1.0, 70,70)))\n\n# Use the default game of life model\nmodel = Ruleset(Life())\n\n# Use an output that shows the cellular automata as blocks in the REPL\noutput = REPLOutput{:block}(init; fps=100)\n\nsim!(output, model, init; tstop=5)","category":"page"},{"location":"#","page":"DynamicGrids.jl","title":"DynamicGrids.jl","text":"More life-like examples:","category":"page"},{"location":"#","page":"DynamicGrids.jl","title":"DynamicGrids.jl","text":"# Morley\nsim!(output, Ruleset(Life(b=[3,6,8], s=[2,4,5]); init=init))\n\n# 2x2\nsim!(output, Ruleset(Life(b=[3,6], s=[1,2,5]); init=init))\n\n# Dimoeba\ninit1 = round.(Int8, max.(0.0, rand(70,70)))\nsim!(output, Ruleset(Life(b=[3,5,6,7,8], s=[5,6,7,8]); init=init1))\n\n## No death\nsim!(output, Ruleset(Life(b=[3], s=[0,1,2,3,4,5,6,7,8]); init))\n\n## 34 life\nsim!(output, Ruleset(Life(b=[3,4], s=[3,4])); init=init, fps=10)\n\n# Replicator\ninit2 = round.(Int8, max.(0.0, rand(70,70)))\ninit2[:, 1:30] .= 0\ninit2[21:50, :] .= 0\nsim!(output, Ruleset(Life(b=[1,3,5,7], s=[1,3,5,7])); init=init2)","category":"page"},{"location":"#Rules-1","page":"DynamicGrids.jl","title":"Rules","text":"","category":"section"},{"location":"#","page":"DynamicGrids.jl","title":"DynamicGrids.jl","text":"Rules define simulation behaviour. They hold data relevant to the simulation, and trigger dispatch of particular applyrule or applyrule! methods. Rules can be chained together arbitrarily to make composite simulations.","category":"page"},{"location":"#Types-and-Constructors-1","page":"DynamicGrids.jl","title":"Types and Constructors","text":"","category":"section"},{"location":"#","page":"DynamicGrids.jl","title":"DynamicGrids.jl","text":"Rule\nCellRule\nNeighborhoodRule\nPartialRule\nPartialNeighborhoodRule\nLife","category":"page"},{"location":"#DynamicGrids.Rule","page":"DynamicGrids.jl","title":"DynamicGrids.Rule","text":"abstract type Rule\n\nA rule contains all the information required to run a rule in a cellular simulation, given an initial array. Rules can be chained together sequentially.\n\nThe output of the rule for an Rule is allways written to the current cell in the grid.\n\n\n\n\n\n","category":"type"},{"location":"#DynamicGrids.CellRule","page":"DynamicGrids.jl","title":"DynamicGrids.CellRule","text":"abstract type CellRule <: Rule\n\nA Rule that only writes and accesses a single cell: its return value is the new value of the cell. This limitation can be useful for performance optimisations.\n\nAccessing the data.source and data.dest arrays directly is not guaranteed to have correct results, and should not be done.\n\n\n\n\n\n","category":"type"},{"location":"#DynamicGrids.NeighborhoodRule","page":"DynamicGrids.jl","title":"DynamicGrids.NeighborhoodRule","text":"abstract type NeighborhoodRule <: Rule\n\nA Rule That only accesses a neighborhood, defined by its radius distance from the current cell.\n\nFor each cell a buffer will be populated containing the neighborhood cells, accessible with buffer(data). This allows memory optimisations and the use of BLAS routines on the neighborhood.  It also means that and no bounds checking is required.\n\nNeighborhoodRule must read only from the state variable and the  neighborhood_buffer array, and never manually write to the dest(data) array.  Its return value is allways written to the central cell.\n\nCustom Neighborhood rules must return their radius with a radius() method.\n\n\n\n\n\n","category":"type"},{"location":"#DynamicGrids.PartialRule","page":"DynamicGrids.jl","title":"DynamicGrids.PartialRule","text":"abstract type PartialRule <: Rule\n\nPartialRule is for rules that manually write to whichever cells of the grid that they choose, instead of updating every cell with their output.\n\nUpdates to the destination array (dest(data)) must be performed manually, while the source array can be accessed with source(data).\n\nThe dest array is copied from the source prior to running the applyrule! method.\n\n\n\n\n\n","category":"type"},{"location":"#DynamicGrids.PartialNeighborhoodRule","page":"DynamicGrids.jl","title":"DynamicGrids.PartialNeighborhoodRule","text":"abstract type PartialNeighborhoodRule <: PartialRule\n\nA Rule that only writes to its neighborhood, defined by its radius distance from the current point. TODO: should this exist?\n\nCustom PartialNeighborhood rules must return their radius with a radius() method.\n\n\n\n\n\n","category":"type"},{"location":"#DynamicGrids.Life","page":"DynamicGrids.jl","title":"DynamicGrids.Life","text":"Rule for game-of-life style cellular automata. \n\nField Description Default Limits\nneighborhood Any Neighborhood RadialNeighborhood{1}() nothing\nb Array, Tuple or Iterable of integers to match neighbors when cell is empty (3, 3) (0, 8)\ns Array, Tuple or Iterable of integers to match neighbors cell is full (2, 3) (0, 8)\n\n\n\n\n\n","category":"type"},{"location":"#Neighborhoods-1","page":"DynamicGrids.jl","title":"Neighborhoods","text":"","category":"section"},{"location":"#","page":"DynamicGrids.jl","title":"DynamicGrids.jl","text":"Neighborhoods define a pattern of cells surrounding the current cell,  and how they are combined to update the value of the current cell.","category":"page"},{"location":"#Types-and-Constructors-2","page":"DynamicGrids.jl","title":"Types and Constructors","text":"","category":"section"},{"location":"#","page":"DynamicGrids.jl","title":"DynamicGrids.jl","text":"Neighborhood\nRadialNeighborhood\nAbstractCustomNeighborhood\nCustomNeighborhood\nLayeredCustomNeighborhood","category":"page"},{"location":"#DynamicGrids.Neighborhood","page":"DynamicGrids.jl","title":"DynamicGrids.Neighborhood","text":"abstract type Neighborhood\n\nNeighborhoods define how surrounding cells are related to the current cell. The neighbors function returns the sum of surrounding cells, as defined by the neighborhood.\n\n\n\n\n\n","category":"type"},{"location":"#DynamicGrids.RadialNeighborhood","page":"DynamicGrids.jl","title":"DynamicGrids.RadialNeighborhood","text":"struct RadialNeighborhood{R} <: AbstractRadialNeighborhood{R}\n\nRadial neighborhoods calculate the surrounding neighborood from the radius around the central cell. The central cell is ommitted.\n\n\n\n\n\n","category":"type"},{"location":"#DynamicGrids.AbstractCustomNeighborhood","page":"DynamicGrids.jl","title":"DynamicGrids.AbstractCustomNeighborhood","text":"abstract type AbstractCustomNeighborhood <: Neighborhood{R}\n\nCustom neighborhoods are tuples of custom coordinates (also tuples) specified in relation  to the central point of the current cell. They can be any arbitrary shape or size, but should be listed in column-major order for performance.\n\n\n\n\n\n","category":"type"},{"location":"#DynamicGrids.CustomNeighborhood","page":"DynamicGrids.jl","title":"DynamicGrids.CustomNeighborhood","text":"Allows completely arbitrary neighborhood shapes by specifying each coordinate specifically.\n\n\n\n\n\n","category":"type"},{"location":"#DynamicGrids.LayeredCustomNeighborhood","page":"DynamicGrids.jl","title":"DynamicGrids.LayeredCustomNeighborhood","text":"Sets of custom neighborhoods that can have separate rules for each set.\n\n\n\n\n\n","category":"type"},{"location":"#Output-1","page":"DynamicGrids.jl","title":"Output","text":"","category":"section"},{"location":"#Output-Types-and-Constructors-1","page":"DynamicGrids.jl","title":"Output Types and Constructors","text":"","category":"section"},{"location":"#","page":"DynamicGrids.jl","title":"DynamicGrids.jl","text":"Output\nArrayOutput\nREPLOutput","category":"page"},{"location":"#DynamicGrids.Output","page":"DynamicGrids.jl","title":"DynamicGrids.Output","text":"abstract type Output <: AbstractArray{T,1}\n\nAll outputs must inherit from Output.\n\nSimulation outputs are decoupled from simulation behaviour and in many cases can be used interchangeably.\n\n\n\n\n\n","category":"type"},{"location":"#DynamicGrids.ArrayOutput","page":"DynamicGrids.jl","title":"DynamicGrids.ArrayOutput","text":"A simple output that stores each step of the simulation in a vector of arrays.\n\nArguments:\n\nframes: Single init array or vector of arrays\nlength: The length of the output.\n\n\n\n\n\n","category":"type"},{"location":"#DynamicGrids.REPLOutput","page":"DynamicGrids.jl","title":"DynamicGrids.REPLOutput","text":"An output that is displayed directly in the REPL. It can either store or discard simulation frames.\n\nArguments:\n\nframes: Single init array or vector of arrays\n\nKeyword Arguments:\n\nfps::Real: frames per second to run at\nshowfps::Real: maximum displayed frames per second\nstore::Bool: store frames or not\ncolor: a color from Crayons.jl\ncutoff::Real: the cutoff point to display a full or empty cell. Default is 0.5\n\nTo choose the display type can pass :braile or :block to the constructor:\n\nREPLOutput{:block}(init)\n\nThe default option is :block.\n\n\n\n\n\n","category":"type"},{"location":"#Frame-processors-1","page":"DynamicGrids.jl","title":"Frame processors","text":"","category":"section"},{"location":"#","page":"DynamicGrids.jl","title":"DynamicGrids.jl","text":"FrameProcessor\nColorProcessor\nGreyscale","category":"page"},{"location":"#DynamicGrids.FrameProcessor","page":"DynamicGrids.jl","title":"DynamicGrids.FrameProcessor","text":"abstract type FrameProcessor\n\nFrame processors convert arrays into RGB24 images for display.\n\n\n\n\n\n","category":"type"},{"location":"#DynamicGrids.ColorProcessor","page":"DynamicGrids.jl","title":"DynamicGrids.ColorProcessor","text":"struct ColorProcessor{S, Z, M} <: FrameProcessor\n\n\" Converts output frames to a colorsheme.\n\nArguments\n\nscheme: a ColorSchemes.jl colorscheme.\n\n\n\n\n\n","category":"type"},{"location":"#DynamicGrids.Greyscale","page":"DynamicGrids.jl","title":"DynamicGrids.Greyscale","text":"struct Greyscale{M1, M2}\n\nDefault colorscheme. Better performance than using a Colorschemes.jl scheme.\n\n\n\n\n\n","category":"type"},{"location":"#Overflow-1","page":"DynamicGrids.jl","title":"Overflow","text":"","category":"section"},{"location":"#","page":"DynamicGrids.jl","title":"DynamicGrids.jl","text":"Overflow\nWrapOverflow\nRemoveOverflow","category":"page"},{"location":"#DynamicGrids.WrapOverflow","page":"DynamicGrids.jl","title":"DynamicGrids.WrapOverflow","text":"struct WrapOverflow <: DynamicGrids.Overflow\n\nWrap cords that overflow boundaries back to the opposite side\n\n\n\n\n\n","category":"type"},{"location":"#DynamicGrids.RemoveOverflow","page":"DynamicGrids.jl","title":"DynamicGrids.RemoveOverflow","text":"struct RemoveOverflow <: DynamicGrids.Overflow\n\nRemove coords that overflow boundaries\n\n\n\n\n\n","category":"type"},{"location":"#Methods-1","page":"DynamicGrids.jl","title":"Methods","text":"","category":"section"},{"location":"#","page":"DynamicGrids.jl","title":"DynamicGrids.jl","text":"Modules = [DynamicGrids]\nOrder   = [:function]","category":"page"},{"location":"#DynamicGrids.VonNeumannNeighborhood-Tuple{}","page":"DynamicGrids.jl","title":"DynamicGrids.VonNeumannNeighborhood","text":"A convenience wrapper to build a VonNeumann neighborhoods as a CustomNeighborhood.\n\nTODO: variable radius\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.resume!-Tuple{Any,Any}","page":"DynamicGrids.jl","title":"DynamicGrids.resume!","text":"resume!(output, ruleset; tadd=100, kwargs...)\n\nRestart the simulation where you stopped last time. For arguments see sim!. The keyword arg tadd indicates the number of frames to add, and of course an init array will not be accepted.\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.ruletypes-Tuple{Ruleset}","page":"DynamicGrids.jl","title":"DynamicGrids.ruletypes","text":"Return a tuple of the base types of the rules in the ruleset\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.savegif","page":"DynamicGrids.jl","title":"DynamicGrids.savegif","text":"savegif(filename::String, o::Output, ruleset; [processor=processor(o)], [kwargs...])\n\nWrite the output array to a gif. You must pass a processor keyword argument for any Output objects not in ImageOutput (which allready have a processor attached).\n\nSaving very large gifs may trigger a bug in Imagemagick.\n\n\n\n\n\n","category":"function"},{"location":"#DynamicGrids.sim!-Tuple{Any,Any}","page":"DynamicGrids.jl","title":"DynamicGrids.sim!","text":"sim!(output, ruleset; init=nothing, tstpan=(1, length(output)),      fps=fps(output), data=nothing, nreplicates=nothing)\n\nRuns the whole simulation, passing the destination aray to the passed in output for each time-step.\n\nArguments\n\noutput: An AbstractOutput to store frames or display them on the screen.\nruleset: A Rule() containing one ore more AbstractRule. These will each be run in sequence.\n\nKeyword Arguments\n\ninit: the initialisation array. If nothing, the Ruleset must contain an init array.\ntspan: the timespan simulaiton will run for.\nfps: the frames per second to display. Will be taken from the output if not passed in.\nnreplicates: the number of replicates to combine in stochastic simulations\ndata: a SimData object. Can reduce allocations when that is important.\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.addpadding-Union{Tuple{N}, Tuple{T}, Tuple{AbstractArray{T,N},Any}} where N where T","page":"DynamicGrids.jl","title":"DynamicGrids.addpadding","text":"Find the maximum radius required by all rules Add padding around the original init array, offset into the negative So that the first real cell is still 1, 1\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.applyinteraction","page":"DynamicGrids.jl","title":"DynamicGrids.applyinteraction","text":"applyinteraction(interacttion::PartialRule, data, state, index)\n\nApplay an interation that returns a tuple of values.\n\nArguments:\n\nsee applyrule\n\n\n\n\n\n","category":"function"},{"location":"#DynamicGrids.applyinteraction!","page":"DynamicGrids.jl","title":"DynamicGrids.applyinteraction!","text":"applyinteraction!(interacttion::PartialRule, data, state, index)\n\nApplay an interation that manually writes to the passed in dest arrays.\n\nArguments:\n\nsee applyrule\n\n\n\n\n\n","category":"function"},{"location":"#DynamicGrids.applyrule","page":"DynamicGrids.jl","title":"DynamicGrids.applyrule","text":"applyrule(rule::Rule, data, state, index)\n\nUpdates cell values based on their current state and the state of other cells as defined in the Rule.\n\nArguments:\n\nrule : Rule\ndata : FrameData\nstate: the value of the current cell\nindex: a (row, column) tuple of Int for the current cell coordinates - t: the current time step\n\nReturns a value to be written to the current cell.\n\n\n\n\n\n","category":"function"},{"location":"#DynamicGrids.applyrule!","page":"DynamicGrids.jl","title":"DynamicGrids.applyrule!","text":"applyrule!(rule::PartialRule, data, state, index)\n\nA rule that manually writes to the dest array, used in rules inheriting from PartialRule.\n\nArguments:\n\nsee applyrule\n\n\n\n\n\n","category":"function"},{"location":"#DynamicGrids.applyrule-Tuple{Chain{#s97} where #s97<:(Tuple{#s96,Vararg{Any,N} where N} where #s96<:NeighborhoodRule),Any,Any,Any,Any}","page":"DynamicGrids.jl","title":"DynamicGrids.applyrule","text":"applyrule(rules::Chain, data, state, (i, j))\n\nChained rules. If a Chain of rules is passed to applyrule, run them sequentially for each  cell.  This can have much beter performance as no writes occur between rules, and they are essentially compiled together into compound rules. This gives correct results only for CellRule, or for a single NeighborhoodRule followed by CellRule.\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.applyrule-Tuple{Life,Any,Any,Any,Any}","page":"DynamicGrids.jl","title":"DynamicGrids.applyrule","text":"rule(rule::Life, state)\n\nRule for game-of-life style cellular automata. This is a demonstration of  Cellular Automata more than a seriously optimised game of life rule.\n\nCells becomes active if it is empty and the number of neightbors is a number in the b array, and remains active the cell is active and the number of neightbors is in the s array.\n\nReturns: boolean\n\nExamples (gleaned from CellularAutomata.jl)\n\n# Life. \ninit = round.(Int64, max.(0.0, rand(-3.0:0.1:1.0, 300,300)))\noutput = REPLOutput{:block}(init; fps=10, color=:red)\nsim!(output, rule, init; time=1000)\n\n# Dimoeba\ninit = rand(0:1, 400, 300)\ninit[:, 100:200] .= 0\noutput = REPLOutput{:braile}(init; fps=25, color=:blue)\nsim!(output, Ruleset(Life(b=(3,5,6,7,8), s=(5,6,7,8))), init; time=1000)\n\n# Replicator\ninit = fill(1, 300,300)\ninit[:, 100:200] .= 0\ninit[10, :] .= 0\noutput = REPLOutput{:block}(init; fps=60, color=:yellow)\nsim!(output, Ruleset(Life(b=(1,3,5,7), s=(1,3,5,7))), init; time=1000)\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.currenttimestep-Tuple{AbstractSimData}","page":"DynamicGrids.jl","title":"DynamicGrids.currenttimestep","text":"Get the actual current timestep, ie. not variable periods like Month\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.frametoimage","page":"DynamicGrids.jl","title":"DynamicGrids.frametoimage","text":"Convert frame matrix to RGB24, using an FrameProcessor\n\n\n\n\n\n","category":"function"},{"location":"#DynamicGrids.handleoverflow!-Tuple{DynamicGrids.SingleSimData,Integer}","page":"DynamicGrids.jl","title":"DynamicGrids.handleoverflow!","text":"Wrap overflow where required. This optimisation allows us to ignore bounds checks on neighborhoods and still use a wraparound grid.\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.hoodsize-Tuple{Integer}","page":"DynamicGrids.jl","title":"DynamicGrids.hoodsize","text":"sizefromradius(radius)\n\nGet the size of a neighborhood dimension from its radius,  which is always 2r + 1.\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.inbounds-Tuple{Tuple,Tuple,Any}","page":"DynamicGrids.jl","title":"DynamicGrids.inbounds","text":"inbounds(x, max, overflow)\n\nCheck grid boundaries for a single coordinate and max value or a tuple of coorinates and max values.\n\nReturns a tuple containing the coordinate(s) followed by a boolean true if the cell is in bounds, false if not.\n\nOverflow of type RemoveOverflow returns the coordinate and false to skip coordinates that overflow outside of the grid. WrapOverflow returns a tuple with the current position or it's wrapped equivalent, and true as it is allways in-bounds.\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.initframes!-Tuple{GraphicOutput,Any}","page":"DynamicGrids.jl","title":"DynamicGrids.initframes!","text":"Frames are deleted and reallocated during the simulation, which this allows runs of any length.\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.initframes!-Tuple{Output,Any}","page":"DynamicGrids.jl","title":"DynamicGrids.initframes!","text":"Frames are preallocated and reused.\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.mapreduceneighbors","page":"DynamicGrids.jl","title":"DynamicGrids.mapreduceneighbors","text":"mapreduceneighbors(f, data, neighborhood, rule, state, index)\n\nRun f over all cells in the neighborhood and sums its return values.  f is a function or functor with the form: f(data, neighborhood, rule, state, hood_index, dest_index). \n\n\n\n\n\n","category":"function"},{"location":"#DynamicGrids.maprule!-Tuple{AbstractSimData,Rule}","page":"DynamicGrids.jl","title":"DynamicGrids.maprule!","text":"Apply the rule for each cell in the grid, using optimisations allowed for the supertype of the rule.\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.neighbors","page":"DynamicGrids.jl","title":"DynamicGrids.neighbors","text":"neighbors(hood::Neighborhood, state, indices, t, source, args...)\n\nChecks all cells in neighborhood and combines them according to the particular neighborhood type.\n\n\n\n\n\n","category":"function"},{"location":"#DynamicGrids.neighbors-Tuple{AbstractRadialNeighborhood,Any,Any,Any}","page":"DynamicGrids.jl","title":"DynamicGrids.neighbors","text":"neighbors(hood::AbstractRadialNeighborhood, buf, state)\n\nSums radial Moore nieghborhoods of any dimension.\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.precalcrule!","page":"DynamicGrids.jl","title":"DynamicGrids.precalcrule!","text":"precalcrule!(rule, data)\n\nRun any precalculations needed to run a rule for a particular frame.\n\nIt may be better to do this in a functional way with an external precalc object passed into a rule via the data object, but it's done statefully for now for simplicity.\n\n\n\n\n\n","category":"function"},{"location":"#DynamicGrids.precalcrules-Tuple{Any,Any}","page":"DynamicGrids.jl","title":"DynamicGrids.precalcrules","text":"precalcrules(rule, data) = rule\n\nRule precalculation. This is a functional approach rebuilding rules recursively. @set from Setfield.jl helps in specific rule implementations.\n\nThe default is to return the existing rule\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.radius","page":"DynamicGrids.jl","title":"DynamicGrids.radius","text":"Return the radius of a rule or ruleset if it has one, otherwise zero.\n\n\n\n\n\n","category":"function"},{"location":"#DynamicGrids.radius-Tuple{Ruleset}","page":"DynamicGrids.jl","title":"DynamicGrids.radius","text":"Find the largest radius present in the passed in rules.\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.runsim!-Tuple{Any,Vararg{Any,N} where N}","page":"DynamicGrids.jl","title":"DynamicGrids.runsim!","text":"run the simulation either directly or asynchronously.\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.sequencerules!-Tuple{AbstractArray{#s96,1} where #s96<:AbstractSimData,Any}","page":"DynamicGrids.jl","title":"DynamicGrids.sequencerules!","text":"Threaded replicate simulations. If nreplicates is set the data object will be a vector of replicate data, so we loop over it with threads.\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.sequencerules!-Tuple{SimData}","page":"DynamicGrids.jl","title":"DynamicGrids.sequencerules!","text":"Iterate over all rules recursively, swapping source and dest arrays. Returns the data object with source and dest arrays ready for the next iteration.\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.setneighbor!","page":"DynamicGrids.jl","title":"DynamicGrids.setneighbor!","text":"Set value of a cell in the neighborhood. Usually called in mapreduceneighbors.\n\n\n\n\n\n","category":"function"},{"location":"#DynamicGrids.simloop!-Tuple{Any,Any,Any}","page":"DynamicGrids.jl","title":"DynamicGrids.simloop!","text":"Loop over the selected timespan, running the ruleset and displaying the output\n\nOperations on outputs and rulesets are allways mutable and in-place. Operations on rules and data objects are functional as they are used in inner loops where immutability improves performance.\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.swapsource-Tuple{DynamicGrids.SingleSimData}","page":"DynamicGrids.jl","title":"DynamicGrids.swapsource","text":"Swap source and dest arrays. Allways returns regular SimData.\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.updatestatus!-Tuple{Any}","page":"DynamicGrids.jl","title":"DynamicGrids.updatestatus!","text":"Initialise the block status array. This tracks whether anything has to be done in an area of the main array.\n\n\n\n\n\n","category":"method"},{"location":"#DynamicGrids.updatetime-Tuple{SimData,Integer}","page":"DynamicGrids.jl","title":"DynamicGrids.updatetime","text":"Uptate timestamp\n\n\n\n\n\n","category":"method"}]
}
